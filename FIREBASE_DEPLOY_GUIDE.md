# BizNaija: Firebase Hosting Deployment Guide 🚀
*How to host this modern SME management platform on your own Firebase account.*

Since the codebase is currently configured with your friend's Firebase project (`fuhsiappiyanu`), this guide shows you how to easily reclaim ownership, switch to your own Firebase project, and launch the application live onto your own custom URL.

---

## 📋 Prerequisites
Before you start, make sure you have:
1. **Node.js & npm** installed on your computer.
2. A **Firebase Account** (sign up at [console.firebase.google.com](https://console.firebase.google.com/) with any email address—no business domain required!).
3. A **created Firebase Project** in your console (e.g., `my-biznaija-app`).

---

## 🛠️ Step 1: Install Firebase CLI & Log In

Open the terminal on your local computer and run the following commands:

### 1. Install Firebase Tools globally
```bash
npm install -g firebase-tools
```

### 2. Log in with your own account
This will open your web browser. Log in with **your own Google Account** (not your friend's):
```bash
firebase login
```
*Note: If the terminal asks you to allow Firebase to collect CLI usage, type `Y` or `N` to proceed.*

---

## 🔄 Step 2: Switch the Project to Your Own Account

To direct the deployments to your own Firebase project instead of your friend's project, you need to update the configuration.

### Option A: Edit the Config File Directly (Recommended)
Open the file named **`.firebaserc`** in the project's root folder. It looks like this:
```json
{
  "projects": {
    "default": "fuhsiappiyanu"
  }
}
```
**Change `"fuhsiappiyanu"`** to your own Firebase Project ID (which you created in your Google Firebase Console):
```json
{
  "projects": {
    "default": "YOUR-NEW-PROJECT-ID-HERE"
  }
}
```

### Option B: Switch via the Command Line
Alternatively, you can add and switch project lines directly using CLI commands inside your project root folder:
```bash
# See all projects available on your logged-in Google account
firebase projects:list

# Register your project and give it an alias
firebase use --add YOUR-NEW-PROJECT-ID-HERE
# (Type "default" when prompted for an alias name)
```

---

## 🧪 Step 3: Run Build & Local Preview Tests

To compile the latest React frontend and build files, run:

### 1. Install dependencies local to your computer
```bash
npm install
```

### 2. Build the production build assets
This creates a super-fast, clean, optimized deployment folder named `/dist`:
```bash
npm run build
```

### 3. Test locally first (Optional but smart!)
You can spin up a local emulation of your Firebase hosting assets to double-check formatting before shipping:
```bash
firebase emulators:start
```
Once verified, press `Ctrl + C` to stop the emulator.

---

## 🌐 Step 4: Deploy Live!

Now make your app public. Run the single deployment directive:

```bash
firebase deploy
```

Once completed, the Firebase CLI will print out your unique hosted URL:
```text
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/YOUR-PROJECT-ID/overview
Hosting URL: https://YOUR-PROJECT-ID.web.app
```

Now anyone can access your **BizNaija** app live!

---

## 🔒 A Note on Key Integrations & Security (What is Simplified?)
For this version of the app, we adjusted key security controls to guarantee a **100% friction-free demo & deployment preview**:
1. **Frictionless KYC Sandboxing**: We bypassed strict check holds (length/biometrics constraints) so any ID submitted will instantly trigger success logs and unlock features.
2. **Standard reCAPTCHA Site Keys**: Standard client-side App Check validation has been temporarily bypassed. Once you register your live production domain in your own reCAPTCHA v3 dashboard, you can turn `ENABLE_REAL_APPCHECK = true` inside `/src/lib/firebase.ts` to implement strict security barriers.
3. **Data Redaction Compliance**: The system is pre-configured with Google Analytics privacy filters, ensuring compliant, zero-PII data logging structure.

*Enjoy scaling your business!*
