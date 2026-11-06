# ELY.pos (v2.0) Workspace Guidelines & Operational Rules

## 🚨 CRITICAL RULE: DO NOT DEPLOY TO PRODUCTION FIREBASE

**Ely's Fresh Fruits & Veggies is actively using this application in live store operations.**

Under NO circumstances should any agent, script, or automated tool deploy or overwrite production resources.

1. **NO FIREBASE DEPLOYMENTS:**
   - NEVER execute `firebase deploy`, `firebase deploy --only hosting`, `firebase deploy --only firestore`, or any related command.
   - NEVER run CLI commands targeting project `freshbyely` or site `elypos`.
   - NEVER deploy Cloud Functions, Firestore Security Rules, or Firebase Hosting assets to production.

2. **LOCAL DEVELOPMENT & TESTING ONLY:**
   - All development and validation must run locally using:
     - `npm run dev` (local Vite development server)
     - `npm run build` (local production bundle verification)
     - `npm run preview` (local preview of the production build)
     - Firebase Local Emulator Suite if local database mocking is required.

3. **GIT & BRANCHING SAFETY:**
   - All v2.0 development, refactoring, and experimental updates must be committed to development/feature branches (e.g., `v2-modernization`).
   - Do not push breaking changes directly to `main`.
