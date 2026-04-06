# SmartSep AI v3 — Mobile Damage Intelligence

> Precision Noir design system · Firebase Auth · Firestore · Live Camera · AI Detection

---

## 🚀 Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Firebase

Open **`src/firebase/config.js`** and replace the placeholder values:

```js
export const firebaseConfig = {
  apiKey:            "YOUR_API_KEY",         // ← replace
  authDomain:        "YOUR_PROJECT.firebaseapp.com",  // ← replace
  projectId:         "YOUR_PROJECT_ID",      // ← replace
  storageBucket:     "YOUR_PROJECT.appspot.com",      // ← replace
  messagingSenderId: "YOUR_SENDER_ID",       // ← replace
  appId:             "YOUR_APP_ID",          // ← replace
};
```

**Where to get these values:**
1. Go to https://console.firebase.google.com
2. Open your project → **Project Settings** (gear icon)
3. Scroll to **Your Apps** → click your web app (or **Add App** → Web)
4. Copy the `firebaseConfig` object

### 3. Enable Firebase Services

In Firebase Console:

**Authentication:**
- Go to **Authentication → Sign-in Methods**
- Enable **Email/Password** ✓
- Enable **Google** ✓ (set your support email)
- Go to **Authentication → Settings → Authorized Domains**
- Make sure **`localhost`** is listed (it should be by default)

**Firestore:**
- Go to **Firestore Database → Create Database**
- Start in **test mode** (you can tighten rules later)

### 4. Run the dev server

```bash
npm run dev
```

Open http://localhost:5173 — the app starts instantly.

---

## 📁 Project Structure

```
smartsep-ai/
├── index.html                  # HTML entry point
├── vite.config.js              # Vite bundler config
├── package.json
├── .env.example                # Environment variable template
├── public/
│   └── favicon.svg
└── src/
    ├── main.js                 # App entry + state + event binding
    ├── styles/
    │   └── main.css            # Full design system (Precision Noir)
    ├── firebase/
    │   ├── config.js           # 🔑 YOUR FIREBASE CONFIG GOES HERE
    │   ├── init.js             # Firebase app init
    │   ├── auth.js             # Auth + Google provider
    │   └── firestore.js        # Firestore db instance
    ├── utils/
    │   ├── data.js             # Mock data (brands, models, scans, shops)
    │   ├── icons.js            # Inline SVG icon system
    │   ├── toast.js            # Toast notification system
    │   └── firestore-helpers.js # CRUD helpers for scans & users
    ├── components/
    │   ├── auth.js             # Login / signup / forgot password
    │   └── shell.js            # Sidebar + topbar + notification panel
    └── pages/
        ├── dashboard.js        # Stats, chart, recent scans, quick actions
        ├── detect.js           # Upload panel + AI result view
        ├── live.js             # Camera feed + detection settings
        ├── history.js          # Filterable scan history table
        ├── shops.js            # Repair shops near Sivakasi
        ├── payment.js          # Free/Pro/Business plans + FAQ
        └── settings.js         # Profile, notifications, danger zone
```

---

## 🔑 Google Sign-In — Fixing Common Issues

| Error | Fix |
|-------|-----|
| `auth/popup-blocked` | Allow pop-ups in your browser for localhost |
| `auth/unauthorized-domain` | Add your domain to Firebase → Auth → Authorized Domains |
| `auth/configuration-not-found` | Check all values in `src/firebase/config.js` |
| `auth/popup-closed-by-user` | User closed the Google window — just try again |
| Google sign-in opens but nothing happens | Make sure you set a support email in Google sign-in method |

---

## 🧠 Connecting Real AI Detection

In `src/main.js`, find `runAnalysis()` and replace the mock section:

```js
// Replace this:
await new Promise(r => setTimeout(r, 3200));
const mock = MOCK_SCANS[Math.floor(Math.random() * MOCK_SCANS.length)];

// With your API:
const formData = new FormData();
formData.append('image', detectSt.file);
formData.append('brand', detectSt.brand);
formData.append('model', detectSt.model);
const res    = await fetch(import.meta.env.VITE_API_URL, { method:'POST', body: formData });
const result = await res.json();
```

---

## 🏗 Build for Production

```bash
npm run build
```

Output goes to `dist/`. Deploy to Vercel, Netlify, or Firebase Hosting.

---

## 🎨 Design System

- **Font:** Syne (display) + DM Sans (body) + JetBrains Mono (data)
- **Colors:** Electric cyan `#00e5ff` + Lime `#b8ff3c` on ink black `#050608`
- **Aesthetic:** Precision Noir — industrial, sharp, high-contrast

---

## 📱 Features

| Feature | Status |
|---------|--------|
| Google OAuth sign-in | ✅ Working |
| Email/password sign-in | ✅ Working |
| Password reset email | ✅ Working |
| Firestore scan persistence | ✅ Working |
| User profile sync | ✅ Working |
| Live camera detection | ✅ Working (getUserMedia) |
| AI damage analysis | 🔄 Demo mode (plug in your API) |
| CSV export | ✅ Working |
| Filter & search history | ✅ Working |
| Repair shop directory | ✅ Working |
| Notification panel | ✅ Working |
| Upgrade / pricing page | ✅ Working |
| Responsive mobile layout | ✅ Working |
