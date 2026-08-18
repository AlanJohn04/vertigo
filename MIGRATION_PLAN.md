# Migration Plan: Firebase to Neon (PostgreSQL)

Converting your React Native (Expo) app from Firebase to Neon (PostgreSQL) is a significant architectural change. Firebase is a "Backend-as-a-Service" (it handles the database and API for you), whereas Neon is a standard Database.

## 1. Architecture Shift
Current: **App -> Firebase (Direct)**
New: **App -> API Server -> Neon Database**

**Why?** You cannot access a PostgreSQL database directly from a mobile app securely. You need a server to hold the database secrets.

## 2. Prerequisites
- **Neon Account**: [https://neon.tech](https://neon.tech)
- **A Backend Host**: You will need to deploy a small backend.
    - Options: Vercel (Next.js/Node), Railway, Render, or Supabase (if you want an all-in-one replacement).
- **Authentication**: You can *keep* Firebase Auth (easiest) or switch to a solution like Clerk.

## 3. Technology Stack Recommendation
We should introduce a modern stack to interface with Neon:
- **Database**: Neon (Postgres)
- **ORM**: Drizzle ORM (Type-safe database client)
- **API**: Expo Router API Routes (if using Expo Router v3+) or a separate Node.js/Express server.

## 4. Database Schema
Based on your current app, here is the SQL schema you will need in Neon.

### Users Table
```sql
CREATE TABLE users (
  uid TEXT PRIMARY KEY, -- Firebase UID
  email TEXT NOT NULL,
  display_name TEXT,
  role TEXT CHECK (role IN ('patient', 'practitioner')),
  photo_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Patients Table
(Using JSONB for complex medical data to match your NoSQL structure)
```sql
CREATE TABLE patients (
  id TEXT PRIMARY KEY, -- The "PT..." ID
  firebase_uid TEXT UNIQUE, -- Original Firestore ID if needed
  practitioner_id TEXT REFERENCES users(uid),
  name TEXT NOT NULL,
  age INTEGER,
  sex TEXT,
  cause TEXT,
  
  -- Medical Details stored as JSON for flexibility
  medical_data JSONB, 
  -- Includes: symptoms, triggers, duration, history, etc.
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 5. Migration Steps
1.  **Set up Neon Project**: Create a project and get the `DATABASE_URL`.
2.  **Create Backend**: Initialize a server (e.g., `server.ts` or `app/api/`) to handle requests.
3.  **Install Drizzle**: `npm install drizzle-orm pg` (and `drizzle-kit` for dev).
4.  **Replace Code**:
    *   **AuthContext**: Keep Firebase Auth, but update `signUp` to call your new API endpoint instead of `setDoc`.
    *   **Home.tsx / AddPatient.tsx**: Replace `getDocs` and `addDoc` with `fetch('https://your-api.com/patients')` calls.

## Next Steps
Do you want me to:
1.  **Set up the schema code** (Drizzle ORM) for you?
2.  **Help build the API layer** (using Expo Router API routes or a separate Express server)?
