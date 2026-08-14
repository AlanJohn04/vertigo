# Neon Database Setup Guide

To set up your production Postgres database on Neon, follow these steps:

## 1. Create a Neon Account
1. Go to [https://console.neon.tech/register](https://console.neon.tech/register).
2. Sign up with GitHub or Google.

## 2. Create a Project
1. Click **"New Project"**.
2. Name it `vertease-prod` (or similar).
3. Select your preferred Region (choose one closest to your users, e.g., US East, Frankfurt, Singapore, etc.).
4. Database Name: `neondb` (default is fine).
5. Click **"Create Project"**.

## 3. Get the Connection String
Once the project is created, you will see a **Connection Details** panel.
1. Ensure "Pooled connection" is checked (recommended for serverless/production).
2. Look for the connection string. It looks like this:
   ```
   postgres://username:password@ep-cool-fog-123456.us-east-1.aws.neon.tech/neondb
   ```
3. **Copy this string.**

## 4. What to provide
I need that **Connection String** to configure your application's environment variables.

---

# Additional Considerations for Production

## Authentication
Neon is a database, not an Auth provider.
*   **Recommendation**: Keep using **Firebase Auth** for user login management. It is secure, production-ready, and you already have it implemented. We will just link the Firebase User ID to the Neon Data.

## File Storage (Images)
Neon does not store large files (images).
*   **Recommendation**: Keep using **Firebase Storage** (or UploadThing, which is already in your package.json).

## Backend Hosting
Since we cannot put the Neon password inside the mobile app code, we need a small API.
*   **Do you have a preferred host?** (Vercel, Railway, Render, AWS?)
*   If not, I will set up the code for a **standard Node.js/Express server** that you can deploy anywhere.
