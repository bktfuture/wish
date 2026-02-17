# Firebase Setup Guide for Shared Notes

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select an existing project
3. Follow the setup wizard (you can disable Google Analytics if you want)

## Step 2: Enable Firestore Database

1. In your Firebase project, go to "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose "Start in test mode" (for development) or set up security rules
4. Select a location for your database (choose the closest to your users)

## Step 3: Get Your Firebase Config

1. In Firebase Console, click the gear icon ⚙️ next to "Project Overview"
2. Select "Project settings"
3. Scroll down to "Your apps" section
4. Click the web icon `</>` to add a web app
5. Register your app (give it a nickname like "threebody")
6. Copy the `firebaseConfig` object

## Step 4: Update firebase.js

1. Open `src/firebase.js`
2. Replace the placeholder values with your actual Firebase config:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

## Step 5: Install Firebase

Run this command in your terminal:

```bash
npm install firebase
```

## Step 6: Set Up Firestore Security Rules (Important!)

1. In Firebase Console, go to "Firestore Database" → "Rules"
2. Update the rules to allow read/write access (for development):

```
```

**⚠️ Warning:** The above rules allow anyone to read/write. For production, you should add proper authentication and security rules.

## Step 7: Test It!

1. Start your development server: `npm run dev`
2. Go to the "hope" page
3. Submit a note - it should appear
4. Open the same page in another browser/incognito window
5. You should see the same note! 🎉

## Notes

- All notes are now shared across all users
- Notes update in real-time (when someone adds or moves a note, everyone sees it)
- The bad words filter still works - filtered notes won't be saved to Firestore


