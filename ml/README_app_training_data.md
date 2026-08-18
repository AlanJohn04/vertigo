# Vertigo App — Synthetic Training Dataset (v2, aligned to app questionnaire)

## What this is
`vertigo_app_training_data.csv` — **2,500 synthetic patient records** (100 per
diagnosis × 25 diagnoses), built directly from your app's actual question
flow (`Vertigo_App_Worksheet-_History.xlsx`, Sheets 1–3), so every column and
every answer value uses **the exact wording the app will collect**. This
supersedes the first dataset I generated (which was based on the older,
broader reference sheet and used different question wording) — use this one
for training the app's diagnosis model, since it will match the app's actual
input schema.

## Diagnoses covered (25)
The 19 diagnoses that were columns in your Sheet 3, **plus 6 additional ones**
you invited me to add for broader coverage, since they present with vertigo/
dizziness/unsteadiness and are common differentials a real triage app will
encounter:

**From your sheet:** BPPV, Recurrent BPPV, Vestibular Neuritis, Pseudo
Vestibular Neuritis, Acute Labyrinthitis (Right/Left), Menière's disease
(Left/Right), PPPD, Ototoxicity (Left/Right/Bilateral), Vestibular migraine,
Superior Semicircular Canal Dehiscence, Alternobaric vertigo, Vestibular
paroxysmia, Central causes, Perilymph Fistula, Autoimmune inner ear disease.

**Added:** Orthostatic Hypotension, Panic Disorder, Motion sickness,
Bilateral Vestibulopathy, Cervicogenic Vertigo, Vertebrobasilar Insufficiency
— common causes of dizziness/unsteadiness that a real patient population
will include, and useful negative/contrastive examples so the model doesn't
over-fit to only the original 19 labels.

Three of your sheet's diagnosis columns (**Pseudo Vestibular Neuritis,
Central causes, Autoimmune**) were blank in your worksheet — I filled these
from standard oto-neurology clinical patterns (documented per-field in the
generator script) rather than leaving them out, since a model needs
examples of every diagnosis it should be able to output.

## How each column maps to your app
Every column corresponds to a specific app question, using its exact answer
options:

| Column(s) | App question |
|---|---|
| `age`, `sex`, `comorbidities` | Sheet 1 demographics |
| `presenting_symptom` | Sheet 1 "Is your patient suffering from: Vertigo / Dizziness / Unsteadiness / Oscillopsia / Not sure" |
| `onset` | Q1 |
| `duration_unit`, `duration_value` | Q2 |
| `sensation_type` | Q3 |
| `episodic_or_persistent` | Q4 |
| `episode_duration_unit/value` | Q4A (only populated when Episodic) |
| `remission_between_episodes` | Q4B (only populated when Episodic) |
| `triggers` | Q5 (multi-select) |
| `head_movement_triggered_or_aggravated` | Q5A (only populated when "Head movements" is a trigger) |
| `recent_head_injury` | Q5B |
| `associated_complaints` | Q6 (multi-select) |
| `ear_symptoms_detail` + `hearing_loss_*` | Q6A / 6A1–6A4 (only populated when "Ear Symptoms" → "Hearing loss" selected) |
| `cerebellar_symptoms_detail` | Q6B (only when "Cerebellar symptoms" selected) |
| `cranial_nerve_symptoms_detail` | Q6C (only when "Cranial nerve dysfunction symptoms" selected) |
| `drug_history_category`, `drug_history_detail` | Q7 |
| `post_onset_medication` | Q8 |

Fields that don't apply because an earlier branching question wasn't
selected (e.g. hearing-loss detail when the patient has no ear symptoms) are
left blank — this is the correct representation of your app's conditional
branching, not missing data.

## How variability was generated
For each diagnosis I built a clinical profile (age range, sex skew, relevant
comorbidities, and a probability for every possible answer at every question,
including which triggers/associated symptoms are typical) based on: (1) your
Sheet 3 answers where present, (2) standard oto-neurology teaching for the
three blank columns and the 6 added diagnoses. Each synthetic patient
independently samples from these probabilities — so, e.g., not every Menière's
patient gets identical answers, but the population as a whole reflects the
real symptom pattern of Menière's disease. A small amount of background noise
(~2–3%) and a "not asked/unknown"-style gap (~5%) on some fields simulate
realistic history-taking variation.

## Before you train on this
- **Still synthetic, not real patient data.** It encodes clinical textbook
  patterns per diagnosis, not the noise and overlap of real presentations.
  It's a strong bootstrap set for building and testing your model pipeline
  end-to-end, but real, clinically-labeled cases should validate it before
  any deployment for actual diagnostic use.
- The 3 diagnoses I filled in from general knowledge (Pseudo Vestibular
  Neuritis, Central causes, Autoimmune) and the 6 added diagnoses are marked
  in the generator script (`generate.py`, included below) — worth a clinical
  review pass before relying on them, since they weren't in your original
  worksheet's reference data.
- All fields are categorical text and will need encoding for most ML
  frameworks (one-hot / ordinal / embeddings depending on model type).
