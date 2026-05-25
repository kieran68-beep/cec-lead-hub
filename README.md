# CEC Lead Hub

Internal tool for lead capture, quoting, and active lead tracking.

---

## Files in this project

| File | Purpose |
|------|---------|
| `index.html` | The full app — homepage, lead capture form, quoting wizard |
| `config.js` | All pricing, settings, and service configuration |
| `appsscript.js` | Copy this into Google Apps Script to connect to Google Sheets |
| `README.md` | This file |

---

## Step 1 — Set up Google Apps Script

This is a one-time setup that connects the tool to your Google Sheet.

### 1a. Open Google Apps Script

1. Go to [script.google.com](https://script.google.com)
2. Click **New project** (top left)
3. Name it `CEC Lead Hub`

### 1b. Paste the script

1. Delete all the default code in the editor
2. Open `appsscript.js` from this project
3. Copy the entire contents and paste it into the Apps Script editor
4. Click **Save** (the floppy disk icon, or Ctrl+S)

### 1c. Deploy as a Web App

1. Click **Deploy** (top right) → **New deployment**
2. Click the gear icon next to "Type" → select **Web app**
3. Fill in the settings:
   - **Description:** CEC Lead Hub API
   - **Execute as:** Me (your Google account)
   - **Who has access:** Anyone
4. Click **Deploy**
5. If asked, click **Authorise access** and follow the Google login prompts
6. **Copy the Web App URL** — it looks like:
   `https://script.google.com/macros/s/XXXXXXXXX/exec`

> ⚠️ Keep this URL private — it gives write access to your sheet.

### 1d. Update config.js

Open `config.js` and replace the placeholder URL:

```js
APPS_SCRIPT_URL: "YOUR_APPS_SCRIPT_URL_HERE",
```

Replace `YOUR_APPS_SCRIPT_URL_HERE` with the URL you copied. For example:

```js
APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbxXXXXXXX/exec",
```

Save the file.

---

## Step 2 — Test locally

Before deploying to GitHub Pages, test the tool locally:

1. Open the project folder on your computer
2. Double-click `index.html` to open it in a browser
3. The homepage should load and try to fetch leads
4. Try adding a test lead — check that it appears in your Google Sheet

> **Note:** Some browsers block fetch requests from local files. If you see errors, try using VS Code's Live Server extension, or deploy to GitHub Pages first.

---

## Step 3 — Deploy to GitHub Pages

### 3a. Create the repository

1. Go to [github.com](https://github.com) and log in as `kieran68-beep`
2. Click **+** (top right) → **New repository**
3. Name it: `cec-lead-hub`
4. Set to **Public**
5. Do NOT tick "Add a README" (we have our own files)
6. Click **Create repository**

### 3b. Upload the files

You have two options:

**Option A — Upload via the GitHub website (easiest):**

1. On your new empty repository page, click **uploading an existing file**
2. Drag and drop ALL files from this project folder:
   - `index.html`
   - `config.js`
   - `appsscript.js`
   - `README.md`
3. Scroll down, add a commit message like `Initial upload`
4. Click **Commit changes**

**Option B — Using Git on your computer:**

```bash
cd path/to/cec-lead-hub
git init
git add .
git commit -m "Initial upload"
git remote add origin https://github.com/kieran68-beep/cec-lead-hub.git
git push -u origin main
```

### 3c. Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** (top menu)
3. Click **Pages** (left sidebar)
4. Under **Source**, select **Deploy from a branch**
5. Branch: **main**, Folder: **/ (root)**
6. Click **Save**
7. Wait 1–2 minutes, then visit:
   `https://kieran68-beep.github.io/cec-lead-hub/`

---

## Step 4 — Link to the CEC hub page (optional)

If you want a central homepage linking to both tools, you can add a simple `hub.html` to either repository, or create a new `cec-tools` repository. The Lead Hub homepage already shows links to both tools.

---

## Making changes later

### Updating prices

All prices are in `config.js`. For example, to change the oven single price from £75 to £80:

```js
{ id: "single", label: "Single oven", price: 80, referToKieran: false },
```

Save the file, commit, and push to GitHub. The change goes live within a few minutes.

### Re-deploying the Apps Script after changes

If you ever change `appsscript.js`:

1. Go back to [script.google.com](https://script.google.com)
2. Open your CEC Lead Hub project
3. Click **Deploy** → **Manage deployments**
4. Click the pencil icon on your existing deployment
5. Change the version to **"New version"**
6. Click **Deploy**

The URL stays the same — no changes needed in `config.js`.

---

## Google Sheet structure

The sheet uses monthly tabs (e.g. "May 2025", "June 2025"). The script creates them automatically when a new month begins.

Each row contains:

| Column | Description |
|--------|-------------|
| Date | When the lead came in |
| Lead Source | How they found you |
| Clean Type | Which services they want |
| Name | Client name |
| Postcode | Client postcode |
| Contact Number | Phone |
| Email | Email (optional) |
| Status | Current lead status |
| Chased Date | When you last chased |
| Notes | Any extra info |
| Quote | Full quote text (if generated) |

---

## Troubleshooting

**Leads aren't loading on the homepage**
- Check that `APPS_SCRIPT_URL` in `config.js` is set correctly
- Make sure the Apps Script is deployed with "Anyone" access
- Try opening the Apps Script URL directly in a browser — you should see JSON

**Lead saved but not appearing in the sheet**
- Check the Apps Script logs: go to script.google.com → your project → **Executions** (left sidebar)
- Look for any red error messages

**"Authorisation required" when deploying Apps Script**
- Click Authorise and follow the Google prompts
- You may need to click "Advanced" → "Go to CEC Lead Hub (unsafe)" on the Google warning screen — this is normal for personal scripts

**CORS errors in browser console**
- This is expected when testing from a local file. Deploy to GitHub Pages to fix it.
