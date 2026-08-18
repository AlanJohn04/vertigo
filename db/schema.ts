import { pgTable, text, timestamp, boolean, jsonb } from 'drizzle-orm/pg-core';

// Users table (mirroring Firebase Auth + Firestore 'users' collection)
export const users = pgTable('users', {
  uid: text('uid').primaryKey(), // Firebase User UID
  email: text('email').notNull(),
  displayName: text('display_name'),
  role: text('role').$type<'patient' | 'practitioner'>(),
  photoURL: text('photo_url'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Patients table
export const patients = pgTable('patients', {
  // Use the "PT..." ID as the primary key if you want to keep that format, 
  // or use a UUID and keep "patientId" as a separate display column.
  // Here we use the PT id as primary for simplicity matching your app.
  id: text('id').primaryKey(), 
  
  practitionerId: text('practitioner_id').references(() => users.uid),
  name: text('name').notNull(),
  
  // Basic Info
  age: text('age'), // Keeping as text to match form data, can be integer
  sex: text('sex'),
  cause: text('cause'),
  
  // JSONB is perfect for storing the complex/nested medical form data 
  // without needing 50 separate columns.
  // This includes: onset, duration, vertigoSensation, episodes, triggers, symptoms, medications, etc.
  medicalData: jsonb('medical_data'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Conversations table for ChatBot history
export const conversations = pgTable('conversations', {
  userId: text('user_id').primaryKey().references(() => users.uid),
  messages: jsonb('messages').default([]), // Array of { id, text, isUser, timestamp }
  updatedAt: timestamp('updated_at').defaultNow(),
});
