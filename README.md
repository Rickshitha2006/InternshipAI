# INTERNSHIPAI

### Smart Internship & Career Advisor

INTERNSHIPAI is a static, responsive web application that helps students understand their internship
readiness. Students enter their academic profile and skills, and the app generates a personalized career
report covering eligibility, skill match, a learning roadmap, and project recommendations.

The app is built to run entirely on **free GitHub Pages hosting** — no backend, no database, no paid
services required.

---

## Features

- Professional student profile form (name, degree, year, CGPA, skills, experience, required skills)
- Client-side Bootstrap validation (required fields, CGPA 0–10, Year 1–4)
- "Load Demo Data" and "Clear Form" buttons
- Realistic **Demo Mode** that works instantly with no backend
- Structured results: eligibility, skill match %, match category, recommended role
- Animated skill-match progress bar with matched skills / skills-to-improve badges
- AI career recommendation card
- 4-week learning roadmap
- Three project recommendations with a highlighted "Best Project to Build"
- Print / Save Report button with dedicated print styling
- Fully responsive (desktop, laptop, tablet, mobile) with no horizontal scrolling
- Accessible semantic HTML, labels, and keyboard-friendly controls

---

## Technologies

- HTML5
- CSS3
- Bootstrap 5 (via CDN)
- Bootstrap Icons (via CDN)
- Vanilla JavaScript (no frameworks, no build tools, no Node.js/npm)

No React, Angular, Vue, Next.js, PHP, Python, Java backend, database, or paid services are used. This is a
100% static website.

---

## Project Structure

```
internship-ai/
│
├── index.html
├── style.css
├── script.js
├── README.md
│
└── assets/
    └── favicon.svg
```

---

## How to Run Locally

No build step is required.

1. Download or clone this folder.
2. Open `index.html` directly in your browser, **or** serve it locally, e.g.:
   ```
   npx serve .
   ```
   (this is only for convenience — no Node.js dependency is required for the app itself).
3. The app runs in **Demo Mode** by default, so everything works immediately with no configuration.

---

## How to Upload to GitHub

1. Create a new GitHub repository, for example: `internship-ai`.
2. Upload these files/folders to the repository root:
   - `index.html`
   - `style.css`
   - `script.js`
   - `README.md`
   - `assets/`
3. Commit and push.

---

## How to Enable GitHub Pages

1. Go to your repository on GitHub.
2. Click **Settings → Pages**.
3. Under "Build and deployment", set **Source** to **Deploy from a branch**.
4. Choose the **main** branch and the **/ (root)** folder.
5. Click **Save**.
6. GitHub will publish your site at:
   ```
   https://USERNAME.github.io/internship-ai/
   ```

The app uses **relative paths** (`./style.css`, `./script.js`, `./assets/favicon.svg`) so it works correctly
when hosted under a subpath like `/internship-ai/`, not just at a domain root.

---

## How Demo Mode Works

At the top of `script.js`:

```js
const DEMO_MODE = true;
```

When `DEMO_MODE` is `true`:

- The app **never calls any external API**.
- Clicking "Analyze My Profile" runs `useDemoData()`, which returns a fixed, realistic sample result
  (candidate Anitha, 60% skill match, Front-End Web Development Intern, etc.) after a short simulated delay.
- The results section clearly displays a **"Demo Result"** badge so users know this is sample data, not a
  live AI-generated report.

This means the site works immediately after being published to GitHub Pages, with zero configuration.

---

## How to Connect Dify (Live AI Mode) — Quick Way for a College Demo

If you just need the app to actually call your live Dify workflow (e.g. to show a professor it's a real
working integration, not hardcoded demo data), you don't need a full backend server. `script.js` supports a
**direct mode**:

```js
const DEMO_MODE = false;
const DIFY_MODE = "direct";
```

With this set:

1. Open the site (locally, or from your own machine) and click **Analyze My Profile**.
2. The browser will prompt you once for your **Dify API Secret Key**. Get this from your Dify app →
   **API Access** → API Key.
3. The key is stored only in that browser tab's `sessionStorage` — it is **never** written into any file,
   never committed to GitHub, and disappears when you close the tab.
4. The app then calls `https://api.dify.ai/v1/workflows/run` directly from the browser with your form data
   mapped to the exact input variables your workflow expects (`student_name`, `degree`, `year`, `cgpa`,
   `skills`, `experience`, `required_skills`), and renders whatever your workflow returns.

**Important limits of this mode:**

- ⚠️ This is fine for a **local demo or a private/controlled showing** (e.g. presenting on your own laptop
  to a professor). It is **not** appropriate for a permanently public GitHub Pages URL that random visitors
  can open — anyone running the page can see the key in their browser's Network tab for as long as their
  own session lasts, and could use it against your Dify account/credits.
- If your Dify workflow has CORS restrictions, direct browser calls may be blocked. If you get a CORS error
  in the console, you'll need the backend/proxy approach below instead.
- The output field names in `normalizeDifyResponse()` (in `script.js`) are guesses based on common naming
  (`eligibility_status`, `skill_match_percentage`, `recommended_role`, etc.). Open your Dify workflow's
  **output variables** and adjust the `pick(...)` calls in that function if your exact variable names differ.

For anything you intend to actually keep public and share as a live link, use the backend/proxy approach
below instead.

## How to Connect Dify (Live AI Mode) — Production-Safe Way

This project already has a working AI workflow built in **Dify**:

- Dify Workflow App: `https://udify.app/workflow/6nAnyAEE8pUZFJTP`
- Dify API Base URL: `https://api.dify.ai/v1`
- Workflow run endpoint: `https://api.dify.ai/v1/workflows/run`

The Dify workflow performs: candidate information analysis, eligibility checking, skill match calculation,
skill category classification, learning roadmap generation, career recommendation, project recommendations,
and produces a final `career_report`.

### Workflow input variables (must match exactly)

```
student_name
degree
year
cgpa
skills
experience
required_skills
```

### Steps to enable live AI mode

1. **Do not** put your Dify API key into any frontend file. GitHub Pages serves static files publicly —
   anything in `index.html`, `style.css`, `script.js`, or the repository is visible to anyone.
2. Deploy a small **secure backend or serverless proxy** (e.g. a serverless function on Vercel, Netlify,
   Cloudflare Workers, AWS Lambda, or any small backend service you control). This backend should:
   - Accept a POST request with the student's form data.
   - Call `https://api.dify.ai/v1/workflows/run` with the header:
     ```
     Authorization: Bearer YOUR_DIFY_API_KEY
     ```
   - Return the workflow result (structured JSON or the `career_report` text) back to the frontend.
3. In `script.js`, set:
   ```js
   const DEMO_MODE = false;
   ```
4. Point `BACKEND_API_URL` in `script.js` to your deployed backend/proxy endpoint, for example:
   ```js
   const BACKEND_API_URL = "https://your-backend.example.com/api/career-advisor";
   ```
5. The frontend will now call `callCareerAdvisorAPI(data)`, which POSTs the form data (using the exact
   variable names above) to your backend — never directly to Dify, and never with the API key exposed.

### Supported response formats

The frontend can render either:

- **Structured JSON** with fields: `candidate_name`, `eligibility_status`, `skill_match_percentage`,
  `match_category`, `recommended_role`, `strong_skills`, `skills_to_improve`, `career_recommendation`,
  `learning_roadmap`, `project_recommendations`, `best_project`, `best_project_reason`.
- **Plain text report** — if the backend only returns a `career_report` string, it is displayed cleanly in
  the career recommendation section.

---

## Security Warning — Why the Dify API Key Cannot Go in the GitHub Frontend

GitHub Pages is **static hosting**: every file in the repository (`index.html`, `style.css`, `script.js`) is
served as-is and is fully visible to anyone who opens the site or views its source. There is no server-side
code execution.

If a real Dify API key were placed in `script.js`, anyone could view the page source, copy the key, and use
it to make unlimited calls on your Dify account, potentially incurring cost or abuse. **This is why:**

- `DIFY_API_KEY` in `script.js` is intentionally left as an **empty placeholder** and must stay that way in
  any public repository.
- Live AI integration requires a small **secure backend/proxy** that holds the real key server-side, never
  in browser-visible code.
- The frontend only ever talks to your own backend (`BACKEND_API_URL`), which in turn talks to Dify.

---

## Troubleshooting

| Issue | Likely Cause | Fix |
|---|---|---|
| Page loads unstyled | Bootstrap CDN blocked or offline | Check internet connection; CDN links require network access |
| Icons not showing | Bootstrap Icons CDN blocked | Check network access to `cdn.jsdelivr.net` |
| "Analyze" button does nothing | JavaScript error | Open browser console for details; ensure `script.js` is loaded |
| Results never appear in live mode | Backend not reachable / `DEMO_MODE` still `true` | Confirm `DEMO_MODE = false` and `BACKEND_API_URL` is correct |
| 404 on GitHub Pages assets | Absolute paths used instead of relative | Ensure all paths use `./` prefix, not a leading `/` |
| API key exposed warning | Key accidentally committed | Remove the key from `script.js`, rotate the key in Dify, and use a backend proxy instead |

---

## Future Enhancements

- Persist submitted profiles locally (e.g. browser storage) so students can revisit past reports
- Multi-language support
- Downloadable PDF report (beyond browser print)
- Support for multiple internship role comparisons in a single analysis
- Optional login and profile history via a lightweight backend

---

© 2026 INTERNSHIPAI. Built with HTML5, CSS3, Bootstrap 5, Bootstrap Icons, and vanilla JavaScript.
