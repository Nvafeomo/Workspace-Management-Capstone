<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Workspace Management System

This contains everything you need to run the app locally.

View your app in AI Studio: https://ai.studio/apps/8ee65343-19d6-4687-a0e5-9dfa3c44fc0d

---

## Prerequisites

- **Node.js** (v18 or newer)
- **npm** (comes with Node.js)

---

## Run the UI (web app)

1. Go to the UI folder:
   ```
   cd workspace_ui
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create `.env.local` in the `workspace_ui` folder with:
   - `VITE_SUPABASE_URL` – your Supabase project URL
   - `VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY` – your Supabase anon key
   - `GEMINI_API_KEY` – your Gemini API key (for AI Studio)

4. Run the app:
   ```
   npm run dev
   ```

   The app will be available at http://localhost:3000

---

## Run the testers (backend / Supabase)

1. From the **project root**, install dependencies (if not already done):
   ```
   npm install
   ```

2. Create `.env.local` in the **project root** (or in `src`) with:
   - `NEXT_PUBLIC_SUPABASE_URL` – your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` – your Supabase anon key

   If `.env.local` is in a different location, update the path in `supabaseClient.ts` to point to it.

3. Run the testers from the **src** folder (not the entities folder):
   ```
   cd src
   npx tsx testers.ts
   ```

---

## Supabase dependencies (project root)

If you need to install Supabase-related packages:

```
npm install dotenv
npm install --save-dev @types/node
npm install @supabase/supabase-js
```
