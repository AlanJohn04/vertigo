import express from 'express';
import cors from 'cors';
import { db } from './db';
import { users, patients, conversations } from '../db/schema';
import { eq } from 'drizzle-orm';
import * as ort from 'onnxruntime-node';
import path from 'path';

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(cors());
app.use(express.json());

// Request Logger Middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    if (req.method === 'POST' || req.method === 'PUT') {
        console.log('Body:', JSON.stringify(req.body, null, 2));
    }
    next();
});

// Root Health Check & Favicon
app.get('/', (req, res) => {
    res.json({ status: 'ok', message: 'VertEase Backend API Server is running' });
});

app.get('/favicon.ico', (req, res) => res.status(204).end());

// --- USERS ---

// Sync/Create User (Call this after Firebase Auth signup)
app.post('/api/users', async (req, res) => {
    try {
        const { uid, email, displayName, role, photoURL } = req.body;

        const existing = await db.select().from(users).where(eq(users.uid, uid));

        if (existing.length > 0) {
            const [updated] = await db.update(users)
                .set({ email, displayName, role, photoURL, updatedAt: new Date() })
                .where(eq(users.uid, uid))
                .returning();
            return res.json(updated);
        } else {
            const [inserted] = await db.insert(users)
                .values({ uid, email, displayName, role, photoURL })
                .returning();
            return res.json(inserted);
        }
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Failed to create user', message: String(error) });
    }
});

// Get User
app.get('/api/users/:uid', async (req, res) => {
    try {
        const { uid } = req.params;
        const [user] = await db.select().from(users).where(eq(users.uid, uid));
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Failed to fetch user', message: String(error) });
    }
});

// --- PATIENTS ---

// Create Patient
app.post('/api/patients', async (req, res) => {
    try {
        const data = req.body;
        console.log(`[${new Date().toISOString()}] Creating/Updating patient:`, data.id);

        const { id, practitionerId, name, age, sex, cause, ...rest } = data;
        const medicalData = rest;

        const finalId = id || `PT${Math.floor(Date.now() / 1000)}`;
        const finalPractitionerId = practitionerId || 'unknown';

        const [newPatient] = await db.insert(patients).values({
            id: finalId,
            practitionerId: finalPractitionerId,
            name: name || 'Unnamed Patient',
            age: age ? String(age) : null,
            sex: sex || 'Not Specified',
            cause: cause || '',
            medicalData
        }).onConflictDoUpdate({
            target: [patients.id],
            set: {
                name: name || 'Unnamed Patient',
                age: age ? String(age) : null,
                sex,
                cause,
                medicalData,
                updatedAt: new Date()
            }
        }).returning();

        res.json(newPatient);
    } catch (error: any) {
        console.error('Error creating patient:', error);
        const detailedMessage = error.cause ? String(error.cause) : String(error);
        res.status(500).json({ error: 'Failed to create patient', message: detailedMessage, fullError: error.message });
    }
});

// Update Patient
app.put('/api/patients/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const { practitionerId, name, age, sex, cause, ...rest } = data;
        const medicalData = rest;

        const [updated] = await db.update(patients)
            .set({
                name,
                age,
                sex,
                cause,
                medicalData,
                updatedAt: new Date()
            })
            .where(eq(patients.id, id))
            .returning();

        res.json(updated);
    } catch (error) {
        console.error('Error updating patient:', error);
        res.status(500).json({ error: 'Failed to update patient', message: String(error) });
    }
});

// List Patients (by Practitioner)
app.get('/api/patients', async (req, res) => {
    try {
        const { practitionerId } = req.query;
        const allPatients = await db.select().from(patients);

        if (practitionerId) {
            const list = allPatients.filter(p => p.practitionerId === String(practitionerId));
            if (list.length > 0) {
                return res.json(list);
            }
        }

        res.json(allPatients);
    } catch (error) {
        console.error('Error fetching patients:', error);
        res.status(500).json({ error: 'Failed to fetch patients', message: String(error) });
    }
});

// Get Patient Detail (with UID/email fallback)
app.get('/api/patients/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const searchStr = String(id).toLowerCase();
        
        const allPatients = await db.select().from(patients);
        const patient = allPatients.find(p => 
            p.id.toLowerCase() === searchStr ||
            p.id.toLowerCase().includes(searchStr) ||
            p.name.toLowerCase().includes(searchStr) ||
            ((p.medicalData as any)?.email && (p.medicalData as any).email.toLowerCase() === searchStr)
        );

        if (!patient) return res.status(404).json({ error: 'Patient not found' });

        const { medicalData, ...rest } = patient;
        const response = { ...rest, ...(medicalData as object) };

        res.json(response);
    } catch (error) {
        console.error('Error fetching patient detail:', error);
        res.status(500).json({ error: 'Failed to fetch patient', message: String(error) });
    }
});

// Lookup Patient profile for logged-in Patient User
app.get('/api/patients-lookup/me', async (req, res) => {
    try {
        const { uid, email, name } = req.query;
        const allPatients = await db.select().from(patients);

        let match = allPatients.find(p => 
            (uid && p.id === String(uid)) ||
            (email && (p.medicalData as any)?.email === String(email)) ||
            (email && p.cause && String(email).toLowerCase() === String((p.medicalData as any)?.email || '').toLowerCase()) ||
            (name && p.name.toLowerCase() === String(name).toLowerCase())
        );

        if (!match && allPatients.length > 0) {
            // Check if patient matches email or name in any field
            match = allPatients.find(p => 
                (email && String(email).toLowerCase().includes(p.name.toLowerCase())) ||
                (name && p.name.toLowerCase().includes(String(name).toLowerCase()))
            ) || allPatients[0];
        }

        if (!match) {
            // Auto-initialize a patient record in Neon DB for this patient user
            const newPatientId = uid ? String(uid) : `PT${Math.floor(Date.now() / 1000)}`;
            const patientName = name ? String(name) : 'Dev Patient';
            const patientEmail = email ? String(email) : 'devtest@vertease.com';

            console.log(`Auto-initializing patient record ${newPatientId} for ${patientName}`);

            const [created] = await db.insert(patients).values({
                id: newPatientId,
                practitionerId: 'unknown',
                name: patientName,
                age: '45',
                sex: 'Female',
                cause: 'Benign Paroxysmal Positional Vertigo (BPPV)',
                medicalData: {
                    email: patientEmail,
                    vertigoSensation: 'Spinning',
                    onset: 'Sudden',
                    episodicOrPersistent: 'Episodic',
                    triggers: ['Head movements'],
                    symptoms: ['Nausea', 'Loss of balance'],
                    episodes: []
                }
            }).returning();

            match = created;
        }

        const { medicalData, ...rest } = match;
        res.json({ ...rest, ...(medicalData as object) });
    } catch (error) {
        console.error('Error looking up patient profile:', error);
        res.status(500).json({ error: 'Failed to lookup patient profile', message: String(error) });
    }
});

// --- EXERCISES & CHECKUPS SYNC ---

app.post('/api/exercises', async (req, res) => {
    try {
        const { patientId, exerciseId, completed } = req.body;
        const allPatients = await db.select().from(patients);
        let patient = allPatients.find(p => 
            p.id === String(patientId) || 
            (p.medicalData as any)?.email === String(patientId) ||
            p.name.toLowerCase().includes(String(patientId).toLowerCase())
        ) || allPatients[0];

        if (!patient) return res.status(404).json({ error: 'Patient not found' });

        const currentData: any = (patient.medicalData as object) || {};
        let completedExercises: string[] = currentData.completedExercises || [];

        if (completed && !completedExercises.includes(exerciseId)) {
            completedExercises.push(exerciseId);
        } else if (!completed) {
            completedExercises = completedExercises.filter(id => id !== exerciseId);
        }

        const count = completedExercises.length;
        const recoveryProgress = Math.min(60 + count * 12, 98);

        const [updated] = await db.update(patients)
            .set({ medicalData: { ...currentData, completedExercises, recoveryProgress }, updatedAt: new Date() })
            .where(eq(patients.id, patient.id))
            .returning();

        res.json({ success: true, completedExercises, recoveryProgress, patientId: patient.id });
    } catch (error) {
        console.error('Error toggling exercise:', error);
        res.status(500).json({ error: 'Failed to update exercise', message: String(error) });
    }
});

app.post('/api/checkups', async (req, res) => {
    try {
        const { patientId, checkup } = req.body;
        const allPatients = await db.select().from(patients);
        let patient = allPatients.find(p => 
            p.id === String(patientId) || 
            (p.medicalData as any)?.email === String(patientId) ||
            p.name.toLowerCase().includes(String(patientId).toLowerCase())
        ) || allPatients[0];

        if (!patient) return res.status(404).json({ error: 'Patient not found' });

        const currentData: any = (patient.medicalData as object) || {};
        const checkups = currentData.checkups || [
            { id: "1", date: "2026-03-20", time: "10:30 AM", practitioner: "Dr. Smith", status: "Upcoming", type: "Follow-up" },
            { id: "2", date: "2026-03-15", time: "2:00 PM", practitioner: "Dr. Smith", status: "Completed", type: "Initial Consult" }
        ];

        if (checkup) {
            checkups.unshift(checkup);
        }

        const nextCheckup = checkups.find((c: any) => c.status === "Upcoming")?.date || "2026-04-02";

        const [updated] = await db.update(patients)
            .set({ medicalData: { ...currentData, checkups, nextCheckup }, updatedAt: new Date() })
            .where(eq(patients.id, patient.id))
            .returning();

        res.json({ success: true, checkups, nextCheckup, patientId: patient.id });
    } catch (error) {
        console.error('Error updating checkup:', error);
        res.status(500).json({ error: 'Failed to update checkup', message: String(error) });
    }
});
app.post('/api/episodes', async (req, res) => {
    try {
        const { patientId, severity, duration, notes, timestamp } = req.body;
        console.log(`Logging episode for patient search target ${patientId}`);

        const allPatients = await db.select().from(patients);
        let patient = allPatients.find(p => 
            p.id === String(patientId) || 
            (p.medicalData as any)?.email === String(patientId) ||
            p.name.toLowerCase().includes(String(patientId).toLowerCase())
        );

        if (!patient) {
            const newId = patientId ? String(patientId) : `PT${Math.floor(Date.now() / 1000)}`;
            const [created] = await db.insert(patients).values({
                id: newId,
                practitionerId: 'unknown',
                name: 'Test Patient',
                age: '45',
                sex: 'Female',
                cause: 'BPPV',
                medicalData: { email: 'test@gmail.com', episodes: [] }
            }).returning();
            patient = created;
        }

        const currentData: any = (patient.medicalData as object) || {};
        const episodes = currentData.episodes || [];
        episodes.push({
            severity,
            duration,
            notes,
            timestamp: timestamp || new Date().toISOString()
        });

        const [updated] = await db.update(patients)
            .set({ medicalData: { ...currentData, episodes }, updatedAt: new Date() })
            .where(eq(patients.id, patient.id))
            .returning();

        res.json({ success: true, count: episodes.length, patientId: patient.id });
    } catch (error) {
        console.error('Error logging episode:', error);
        res.status(500).json({ error: 'Failed to log episode', message: String(error) });
    }
});

// --- CHAT CONVERSATIONS ---

app.get('/api/conversations/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const [conversation] = await db.select().from(conversations).where(eq(conversations.userId, userId));
        if (!conversation) return res.json({ messages: [] });
        res.json(conversation);
    } catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({ error: 'Failed to fetch conversation history', message: String(error) });
    }
});

app.post('/api/conversations/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { messages } = req.body;

        const existing = await db.select().from(conversations).where(eq(conversations.userId, userId));

        if (existing.length > 0) {
            const [updated] = await db.update(conversations)
                .set({ messages, updatedAt: new Date() })
                .where(eq(conversations.userId, userId))
                .returning();
            res.json(updated);
        } else {
            const [inserted] = await db.insert(conversations).values({
                userId,
                messages,
            }).returning();
            res.json(inserted);
        }
    } catch (error) {
        console.error('Error syncing conversation history:', error);
        res.status(500).json({ error: 'Failed to sync conversation history', message: String(error) });
    }
});

// --- ML PREDICTION (v2 — questionnaire-based, single 25-diagnosis model) ---
const modelCache: { [key: string]: ort.InferenceSession } = {};
let featureColumns: string[] = [];
let labelMap: { [key: string]: string } = {};

// Load feature columns and label map at startup
const fs = require('fs');
try {
    const fcPath = path.join(__dirname, 'ml', 'models', 'feature_columns.json');
    const lmPath = path.join(__dirname, 'ml', 'models', 'label_map.json');
    if (fs.existsSync(fcPath)) {
        featureColumns = JSON.parse(fs.readFileSync(fcPath, 'utf-8'));
        console.log(`Loaded ${featureColumns.length} feature columns`);
    }
    if (fs.existsSync(lmPath)) {
        labelMap = JSON.parse(fs.readFileSync(lmPath, 'utf-8'));
        console.log(`Loaded ${Object.keys(labelMap).length} diagnosis labels`);
    }
} catch (e) {
    console.warn('Could not load ML metadata (model may not be trained yet):', e);
}

// Helper: encode questionnaire answers into the feature vector
function encodeFeatures(answers: any): number[] {
    const vector = new Array(featureColumns.length).fill(0);

    for (let i = 0; i < featureColumns.length; i++) {
        const col = featureColumns[i];

        // Numeric columns
        if (col === 'age') {
            vector[i] = parseFloat(answers.age) || 0;
        } else if (col === 'duration_value') {
            vector[i] = parseFloat(answers.duration_value) || 0;
        } else if (col === 'episode_duration_value') {
            vector[i] = parseFloat(answers.episode_duration_value) || 0;
        }
        // Multi-select columns (e.g., "comorbidities__Diabetes")
        else if (col.includes('__')) {
            const [field, value] = col.split('__');
            const answer = answers[field];
            if (answer) {
                // answer can be a string (semicolon-separated) or an array
                const vals = Array.isArray(answer) ? answer : String(answer).split(';').map((s: string) => s.trim());
                if (vals.includes(value)) {
                    vector[i] = 1.0;
                }
            }
        }
        // Single-select categorical columns (e.g., "sex_Female")
        else if (col.includes('_')) {
            // Find the field name and value: "onset_Sudden" -> field="onset", value="Sudden"
            // But be careful: some fields have underscores in their names like "drug_history_category"
            // Strategy: try matching against known single-select field prefixes
            const singleFields = [
                'sex', 'presenting_symptom', 'onset', 'duration_unit',
                'sensation_type', 'episodic_or_persistent',
                'episode_duration_unit', 'remission_between_episodes',
                'head_movement_triggered_or_aggravated', 'recent_head_injury',
                'hearing_loss_laterality', 'hearing_loss_onset',
                'hearing_loss_timing', 'hearing_loss_progression',
                'drug_history_category', 'drug_history_detail',
                'post_onset_medication'
            ];

            for (const field of singleFields) {
                const prefix = field + '_';
                if (col.startsWith(prefix)) {
                    const expectedValue = col.substring(prefix.length);
                    const answer = answers[field];
                    if (answer && String(answer).trim() === expectedValue) {
                        vector[i] = 1.0;
                    }
                    break;
                }
            }
        }
    }

    return vector;
}

// GET endpoint to return available diagnoses and feature info
app.get('/api/ml/info', (req, res) => {
    res.json({
        numFeatures: featureColumns.length,
        numDiagnoses: Object.keys(labelMap).length,
        diagnoses: labelMap,
        modelLoaded: !!modelCache['vertigo_diagnosis']
    });
});

// POST predict endpoint — accepts questionnaire answers
app.post('/api/predict', async (req, res) => {
    try {
        const answers = req.body;

        if (!answers || typeof answers !== 'object') {
            return res.status(400).json({ error: 'Missing questionnaire answers in request body' });
        }

        // Support legacy format (task/featureSet/features array)
        if (answers.features && Array.isArray(answers.features)) {
            // Legacy mode: use features array directly
            const modelName = 'vertigo_diagnosis';
            const modelPath = path.join(__dirname, 'ml', 'models', `${modelName}.onnx`);

            if (!modelCache[modelName]) {
                try {
                    modelCache[modelName] = await ort.InferenceSession.create(modelPath);
                } catch (err) {
                    console.error(`Failed to load model:`, err);
                    return res.status(404).json({ error: 'Model not found or failed to load', details: String(err) });
                }
            }

            const session = modelCache[modelName];
            const inputName = session.inputNames[0];
            const tensor = new ort.Tensor('float32', Float32Array.from(answers.features), [1, answers.features.length]);
            const feeds: Record<string, ort.Tensor> = {};
            feeds[inputName] = tensor;
            const results = await session.run(feeds);

            const labelTensor = results[session.outputNames[0]];
            const diagnosisIdx = Number(labelTensor.data[0]);
            const diagnosisName = labelMap[String(diagnosisIdx)] || `Unknown (${diagnosisIdx})`;

            let confidence = 0;
            if (session.outputNames.length > 1) {
                const probsTensor = results[session.outputNames[1]];
                try {
                    const vals = Array.from(probsTensor.data as any).filter((v: any) => typeof v === 'number');
                    if (vals.length > 0) confidence = Math.max(...(vals as number[]));
                } catch (e) { /* ignore */ }
            }

            return res.json({ diagnosis: diagnosisIdx, diagnosisName, confidence });
        }

        // New mode: encode questionnaire answers
        if (featureColumns.length === 0) {
            return res.status(500).json({ error: 'Model metadata not loaded. Train the model first.' });
        }

        const featureVector = encodeFeatures(answers);

        const modelName = 'vertigo_diagnosis';
        const modelPath = path.join(__dirname, 'ml', 'models', `${modelName}.onnx`);

        if (!modelCache[modelName]) {
            try {
                modelCache[modelName] = await ort.InferenceSession.create(modelPath);
            } catch (err) {
                console.error(`Failed to load model:`, err);
                return res.status(404).json({ error: 'Model not found or failed to load', details: String(err) });
            }
        }

        const session = modelCache[modelName];
        const inputName = session.inputNames[0];
        const tensor = new ort.Tensor('float32', Float32Array.from(featureVector), [1, featureVector.length]);
        const feeds: Record<string, ort.Tensor> = {};
        feeds[inputName] = tensor;

        const results = await session.run(feeds);

        const labelTensor = results[session.outputNames[0]];
        const diagnosisIdx = Number(labelTensor.data[0]);
        const diagnosisName = labelMap[String(diagnosisIdx)] || `Unknown (${diagnosisIdx})`;

        let confidence = 0;
        let allProbabilities: { [key: string]: number } = {};

        if (session.outputNames.length > 1) {
            const probsTensor = results[session.outputNames[1]];
            try {
                const vals = Array.from(probsTensor.data as any).filter((v: any) => typeof v === 'number') as number[];
                if (vals.length > 0) {
                    confidence = Math.max(...vals);
                    // Map probabilities to diagnosis names
                    for (let i = 0; i < vals.length; i++) {
                        const name = labelMap[String(i)] || `Class ${i}`;
                        allProbabilities[name] = Math.round(vals[i] * 10000) / 100; // percentage with 2 decimals
                    }
                }
            } catch (e) {
                console.error('Error extracting probabilities:', e);
            }
        }

        // Get top 3 differential diagnoses
        const topDiagnoses = Object.entries(allProbabilities)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, prob]) => ({ name, probability: prob }));

        res.json({
            diagnosis: diagnosisIdx,
            diagnosisName,
            confidence,
            topDiagnoses,
            featureCount: featureVector.length
        });

    } catch (error) {
        console.error('Error during ML prediction:', error);
        res.status(500).json({ error: 'Failed to run prediction', message: String(error) });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
});

