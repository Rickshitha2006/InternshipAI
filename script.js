/* =========================================================
   INTERNSHIPAI - script.js
   Smart Internship & Career Advisor
   ========================================================= */

/* =========================================================
   0. CONFIGURATION
   ========================================================= */

// When true, the app uses local demo data and never calls any API.
const DEMO_MODE = false;

// How the app should get its real result when DEMO_MODE is false:
//   "direct" -> browser calls the Dify Workflow API directly using the key
//               set in DIFY_API_KEY below. Simple - no separate backend or
//               Worker needed. Fine for a local/private college project demo.
//               NOT safe to push to a PUBLIC GitHub repo with the real key
//               left in place (see README.md for why).
const DIFY_MODE = "direct";

// Your Cloudflare Worker proxy URL - not used in "direct" mode, only needed
// if you switch DIFY_MODE back to "dify-backend" later.
const BACKEND_API_URL = "https://internshipai-proxy.rickshithaanandakumarsmart.workers.dev";

// --- Dify direct-call config (used when DIFY_MODE = "direct") ---
const DIFY_API_BASE_URL = "https://api.dify.ai/v1";
const DIFY_WORKFLOW_RUN_URL = DIFY_API_BASE_URL + "/workflows/run";

// Your Dify API key, used directly by the browser in "direct" mode.
// Fine for a local college project demo. Do NOT commit this to a PUBLIC
// GitHub repo with the real key left in - see README.md for why.
const DIFY_API_KEY = "app-JW3mI2HIOM2WIFomOyPZT4uV";

// sessionStorage key used to hold a runtime-entered Dify key (legacy "direct" mode only).
const DIFY_SESSION_KEY_NAME = "internshipai_dify_key";

/* =========================================================
   1. DEMO DATA
   ========================================================= */

const DEMO_RESULT = {
  candidate_name: "Anitha",
  eligibility_status: "Eligible",
  skill_match_percentage: 60,
  match_category: "Moderate Match",
  recommended_role: "Front-End Web Development Intern",
  strong_skills: ["HTML", "CSS", "Bootstrap"],
  skills_to_improve: ["JavaScript", "AngularJS"],
  career_recommendation:
    "Focus on strengthening JavaScript fundamentals and AngularJS to complement your HTML, CSS, and Bootstrap foundation. Build practical projects to improve your internship readiness.",
  learning_roadmap: [
    {
      week: "Week 1",
      skill: "JavaScript",
      what_to_learn:
        "Core syntax, variables, data types, control flow, functions, and basic DOM manipulation."
    },
    {
      week: "Week 2",
      skill: "JavaScript ES6 and Asynchronous Programming",
      what_to_learn:
        "let/const, arrow functions, template literals, promises, async/await, and API calls."
    },
    {
      week: "Week 3",
      skill: "AngularJS",
      what_to_learn:
        "Modules, controllers, services, directives, data binding, and routing."
    },
    {
      week: "Week 4",
      skill: "Practical Project",
      what_to_learn:
        "Build a task manager web application using HTML, CSS, Bootstrap, JavaScript, and AngularJS."
    }
  ],
  project_recommendations: [
    {
      name: "Student Performance Dashboard",
      description:
        "Build a dashboard that displays student marks, attendance, and performance analysis.",
      technologies: ["HTML", "CSS", "Bootstrap", "JavaScript"],
      skills_developed: ["JavaScript", "dashboard design", "data visualization"]
    },
    {
      name: "Student Management System",
      description:
        "Create a web application to manage student details, courses, marks, and attendance.",
      technologies: ["HTML", "CSS", "Bootstrap", "JavaScript"],
      skills_developed: ["DOM manipulation", "forms", "CRUD concepts"]
    },
    {
      name: "Internship Application Tracker",
      description:
        "Build an application to track internship applications, company names, application status, interview dates, and results.",
      technologies: ["HTML", "CSS", "Bootstrap", "JavaScript"],
      skills_developed: ["JavaScript", "forms", "local storage", "UI design"]
    }
  ],
  best_project: "Internship Application Tracker",
  best_project_reason:
    "It is directly related to the student's career goal and demonstrates practical JavaScript, UI, form handling, and application management skills."
};

const LOADING_MESSAGES = [
  "Analyzing your profile...",
  "Checking internship eligibility...",
  "Analyzing skill match...",
  "Preparing your career roadmap...",
  "Generating recommendations..."
];

/* =========================================================
   2. DOM REFERENCES
   ========================================================= */

const form = document.getElementById("profileForm");
const analyzeBtn = document.getElementById("analyzeBtn");
const demoDataBtn = document.getElementById("demoDataBtn");
const clearFormBtn = document.getElementById("clearFormBtn");
const heroDemoBtn = document.getElementById("heroDemoBtn");
const printBtn = document.getElementById("printBtn");

const loadingState = document.getElementById("loadingState");
const loadingMessage = document.getElementById("loadingMessage");
const formAlertContainer = document.getElementById("formAlertContainer");
const resultsSection = document.getElementById("results");

let loadingIntervalId = null;

/* =========================================================
   3. INIT
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  form.addEventListener("submit", handleAnalyzeSubmit);
  demoDataBtn.addEventListener("click", loadDemoData);
  clearFormBtn.addEventListener("click", clearForm);
  printBtn.addEventListener("click", () => window.print());

  if (heroDemoBtn) {
    heroDemoBtn.addEventListener("click", () => {
      loadDemoData();
      document.getElementById("analyze").scrollIntoView({ behavior: "smooth" });
    });
  }
});

/* =========================================================
   4. FORM HELPERS
   ========================================================= */

function loadDemoData() {
  document.getElementById("studentName").value = "Anitha";
  document.getElementById("degree").value = "BSc Computer Science";
  document.getElementById("year").value = "1";
  document.getElementById("cgpa").value = "8.2";
  document.getElementById("skills").value = "HTML, CSS, Bootstrap";
  document.getElementById("experience").value = "Fresher";
  document.getElementById("requiredSkills").value =
    "HTML, CSS, Bootstrap, JavaScript, AngularJS";

  form.classList.remove("was-validated");
  clearFieldValidationStyles();
  showAlert("Demo data loaded. You can now click \"Analyze My Profile\".", "success");
}

function clearForm() {
  form.reset();
  form.classList.remove("was-validated");
  clearFieldValidationStyles();
  clearAlert();
  resetResults();
}

function clearFieldValidationStyles() {
  const fields = form.querySelectorAll(".form-control, .form-select");
  fields.forEach((el) => {
    el.classList.remove("is-invalid", "is-valid");
  });
}

function getFormData() {
  return {
    student_name: document.getElementById("studentName").value.trim(),
    degree: document.getElementById("degree").value.trim(),
    year: document.getElementById("year").value,
    cgpa: document.getElementById("cgpa").value,
    skills: document.getElementById("skills").value.trim(),
    experience: document.getElementById("experience").value,
    required_skills: document.getElementById("requiredSkills").value.trim()
  };
}

function validateForm() {
  let isValid = true;
  const data = getFormData();

  const yearNum = parseInt(data.year, 10);
  const cgpaNum = parseFloat(data.cgpa);

  if (!data.student_name) {
    markInvalid("studentName");
    isValid = false;
  } else {
    markValid("studentName");
  }

  if (!data.degree) {
    markInvalid("degree");
    isValid = false;
  } else {
    markValid("degree");
  }

  if (!data.year || isNaN(yearNum) || yearNum < 1 || yearNum > 4) {
    markInvalid("year");
    isValid = false;
  } else {
    markValid("year");
  }

  if (!data.cgpa || isNaN(cgpaNum) || cgpaNum < 0 || cgpaNum > 10) {
    markInvalid("cgpa");
    isValid = false;
  } else {
    markValid("cgpa");
  }

  if (!data.skills) {
    markInvalid("skills");
    isValid = false;
  } else {
    markValid("skills");
  }

  if (!data.experience) {
    markInvalid("experience");
    isValid = false;
  } else {
    markValid("experience");
  }

  if (!data.required_skills) {
    markInvalid("requiredSkills");
    isValid = false;
  } else {
    markValid("requiredSkills");
  }

  form.classList.add("was-validated");
  return isValid;
}

function markInvalid(id) {
  const el = document.getElementById(id);
  el.classList.add("is-invalid");
  el.classList.remove("is-valid");
}

function markValid(id) {
  const el = document.getElementById(id);
  el.classList.add("is-valid");
  el.classList.remove("is-invalid");
}

/* =========================================================
   5. SUBMIT / ANALYZE FLOW
   ========================================================= */

async function handleAnalyzeSubmit(event) {
  event.preventDefault();
  clearAlert();

  if (!validateForm()) {
    showAlert("Please correct the highlighted fields before analyzing.", "danger");
    return;
  }

  const formData = getFormData();

  showLoading();

  try {
    let result;

    if (DEMO_MODE) {
      result = await useDemoData();
    } else if (DIFY_MODE === "direct") {
      const rawDifyResponse = await callDifyWorkflowDirect(formData);
      result = normalizeDifyResponse(rawDifyResponse);
    } else if (DIFY_MODE === "dify-backend") {
      const rawDifyResponse = await callCareerAdvisorAPI(formData);
      result = normalizeDifyResponse(rawDifyResponse);
    } else {
      const backendResponse = await callCareerAdvisorAPI(formData);
      result = normalizeApiResponse(backendResponse);
    }

    hideLoading();
    showResults();
    renderResults(result, DEMO_MODE);
  } catch (error) {
    console.error("Analysis error:", error);
    hideLoading();
    showError(
      "Unable to generate your report right now. Please try again."
    );
  }
}

/**
 * Simulates the demo analysis with a short artificial delay
 * so the loading experience feels realistic.
 */
function useDemoData() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(DEMO_RESULT);
    }, 400);
  });
}

/* =========================================================
   6. API CALL (used only when DEMO_MODE = false)
   ========================================================= */

async function callCareerAdvisorAPI(data) {
  const response = await fetch(BACKEND_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    let detail = "";
    try {
      detail = await response.text();
    } catch (e) {
      // ignore - detail stays empty
    }
    // Log the real reason to the console so it can be diagnosed;
    // the user-facing message stays generic (see showError in the caller).
    console.error("Backend error response (" + response.status + "):", detail);
    throw new Error("API request failed");
  }

  return await response.json();
}

/**
 * Normalizes a backend/Dify response into the internal result shape.
 * Supports either a structured JSON object or a plain text career_report.
 */
function normalizeApiResponse(raw) {
  if (!raw) {
    throw new Error("Empty API response");
  }

  // Structured JSON fields expected from the backend/Dify workflow.
  if (raw.candidate_name || raw.eligibility_status || raw.skill_match_percentage) {
    return {
      candidate_name: raw.candidate_name || "-",
      eligibility_status: raw.eligibility_status || "-",
      skill_match_percentage: Number(raw.skill_match_percentage) || 0,
      match_category: raw.match_category || "-",
      recommended_role: raw.recommended_role || "-",
      strong_skills: raw.strong_skills || [],
      skills_to_improve: raw.skills_to_improve || [],
      career_recommendation: raw.career_recommendation || "-",
      learning_roadmap: raw.learning_roadmap || [],
      project_recommendations: raw.project_recommendations || [],
      best_project: raw.best_project || "-",
      best_project_reason: raw.best_project_reason || "-"
    };
  }

  // Fallback: plain text report (e.g. raw.career_report)
  if (raw.career_report) {
    return {
      candidate_name: "-",
      eligibility_status: "-",
      skill_match_percentage: 0,
      match_category: "-",
      recommended_role: "-",
      strong_skills: [],
      skills_to_improve: [],
      career_recommendation: raw.career_report,
      learning_roadmap: [],
      project_recommendations: [],
      best_project: "-",
      best_project_reason: "-",
      is_plain_text_report: true
    };
  }

  throw new Error("Unrecognized API response format");
}

/* =========================================================
   6b. DIRECT DIFY CALL (DIFY_MODE = "direct")
   ========================================================= */

/**
 * Gets the Dify API secret key for this session. Prompts the user once and
 * keeps it only in sessionStorage (cleared when the tab/browser closes).
 * The key is NEVER written to a file, NEVER hardcoded, and NEVER sent
 * anywhere other than directly to https://api.dify.ai from this browser.
 *
 * Get your key from: Dify app -> your workflow -> "API Access" -> API Key.
 */
function getDifyApiKey() {
  // If a key is already hardcoded above, use it directly - no popup.
  if (DIFY_API_KEY) {
    return DIFY_API_KEY;
  }

  let key = sessionStorage.getItem(DIFY_SESSION_KEY_NAME);
  if (!key) {
    key = window.prompt(
      "Enter your Dify Workflow API Secret Key.\n\n" +
      "This is kept only in this browser tab for this session - it is never " +
      "saved to a file or sent anywhere except directly to api.dify.ai."
    );
    if (key && key.trim()) {
      key = key.trim();
      sessionStorage.setItem(DIFY_SESSION_KEY_NAME, key);
    } else {
      key = null;
    }
  }
  return key;
}

/**
 * Calls the Dify Workflow "run" endpoint directly from the browser using
 * the runtime-entered API key. Only used when DIFY_MODE = "direct".
 */
async function callDifyWorkflowDirect(data) {
  const apiKey = getDifyApiKey();
  if (!apiKey) {
    throw new Error("A Dify API key is required to run live analysis.");
  }

  const response = await fetch(DIFY_WORKFLOW_RUN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + apiKey
    },
    body: JSON.stringify({
      inputs: {
        student_name: data.student_name,
        degree: data.degree,
        year: data.year,
        cgpa: data.cgpa,
        skills: data.skills,
        experience: data.experience,
        required_skills: data.required_skills
      },
      response_mode: "blocking",
      user: "internshipai-frontend"
    })
  });

  if (!response.ok) {
    // If the key was rejected, clear it so the next attempt re-prompts
    // instead of silently reusing a bad key.
    if (response.status === 401 || response.status === 403) {
      sessionStorage.removeItem(DIFY_SESSION_KEY_NAME);
    }
    const errBody = await response.text().catch(() => "");
    throw new Error("Dify API request failed (" + response.status + "): " + errBody);
  }

  return await response.json();
}

/**
 * Normalizes a raw Dify workflow "run" response into the internal result
 * shape used by renderResults(). Dify's response looks like:
 *   { workflow_run_id, task_id, data: { status, outputs: { ... }, ... } }
 *
 * This reads `data.outputs` and tries several likely field names, since the
 * exact output variable names depend on how your workflow is configured in
 * Dify's Studio. Adjust the field-name lookups below to match your workflow's
 * actual output variable names if they differ.
 */
/**
 * Your Dify workflow returns a single text output field (structured_output)
 * containing the entire report as formatted text, e.g.:
 *   "Candidate Name: Rickshi\nEligibility Status: Eligible\nSkill Match: 66.67%..."
 * This parses that text into the structured shape renderResults() expects.
 */
function parseDifyTextReport(text) {
  const get = (label) => {
    const re = new RegExp(label + "\\s*:\\s*(.+)");
    const m = text.match(re);
    return m ? m[1].trim() : "";
  };

  const candidate_name = get("Candidate Name");
  const eligibility_status = get("Eligibility Status");
  const skillMatchRaw = get("Skill Match");
  const percMatch = skillMatchRaw.match(/[\d.]+/);
  const skill_match_percentage = percMatch ? parseFloat(percMatch[0]) : 0;
  const match_category = get("Match Category");
  const recommended_role = get("Recommended Role");
  const strong_skills = get("Strong Skills").split(",").map((s) => s.trim()).filter(Boolean);
  const skills_to_improve = get("Skills to Improve").split(",").map((s) => s.trim()).filter(Boolean);

  let career_recommendation = "";
  const careerMatch = text.match(
    /Career Recommendation:\s*([\s\S]*?)(?:\n\s*(?:Learning Roadmap|Missing Skills|Project Recommendations|Best Project to Build)\s*:|$)/i
  );
  if (careerMatch) career_recommendation = careerMatch[1].trim();

  const learning_roadmap = [];
  const weekRegex = /Week\s*(\d+)\s*:\s*([^\n]+)\n(?:What to learn:|Project:)\s*([\s\S]*?)(?=\n\s*Week\s*\d+\s*:|\n\s*Project Recommendations|\n\s*Best Project to Build|$)/gi;
  let wm;
  while ((wm = weekRegex.exec(text)) !== null) {
    learning_roadmap.push({
      week: "Week " + wm[1],
      skill: wm[2].trim(),
      what_to_learn: wm[3].trim()
    });
  }

  const project_recommendations = [];
  const projRegex = /\d+\.\s*Project Name:\s*([^\n]+)\nDescription:\s*([\s\S]*?)\nTechnologies:\s*([^\n]+)\nSkills Developed:\s*([^\n]+)/gi;
  let pm;
  while ((pm = projRegex.exec(text)) !== null) {
    project_recommendations.push({
      name: pm[1].trim(),
      description: pm[2].trim(),
      technologies: pm[3].split(",").map((s) => s.trim()).filter(Boolean),
      skills_developed: pm[4].split(",").map((s) => s.trim()).filter(Boolean)
    });
  }

  let best_project = "";
  let best_project_reason = "";
  const bestMatch = text.match(/Best Project to Build:\s*([\s\S]*)$/i);
  if (bestMatch) {
    const bestText = bestMatch[1].trim();
    // Splits on an em dash / en dash / hyphen surrounded by spaces
    // (Dify tends to return "Project Name \u2013 reason").
    const dashSplit = bestText.split(/\s[\u2013\u2014-]\s/);
    best_project = dashSplit[0].trim();
    best_project_reason = dashSplit.slice(1).join(" - ").trim();
  }

  return {
    candidate_name: candidate_name || "-",
    eligibility_status: eligibility_status || "-",
    skill_match_percentage,
    match_category: match_category || "-",
    recommended_role: recommended_role || "-",
    strong_skills,
    skills_to_improve,
    career_recommendation: career_recommendation || "-",
    learning_roadmap,
    project_recommendations,
    best_project: best_project || "-",
    best_project_reason: best_project_reason || "-"
  };
}

function normalizeDifyResponse(raw) {
  if (!raw || !raw.data) {
    throw new Error("Unexpected Dify response format");
  }

  if (raw.data.status && raw.data.status !== "succeeded") {
    throw new Error("Dify workflow did not succeed (status: " + raw.data.status + ")");
  }

  const outputs = raw.data.outputs || {};

  // Your workflow returns everything as one text blob in "structured_output".
  // Parse it directly rather than looking for separate JSON fields.
  if (typeof outputs.structured_output === "string" && outputs.structured_output.trim()) {
    return parseDifyTextReport(outputs.structured_output);
  }

  // Fallback path, in case the workflow output shape changes later to
  // return separate structured fields instead of one text blob.
  const pick = (...keys) => {
    for (const k of keys) {
      if (outputs[k] !== undefined && outputs[k] !== null && outputs[k] !== "") {
        return outputs[k];
      }
    }
    return undefined;
  };

  const asList = (value) => {
    if (Array.isArray(value)) return value;
    if (typeof value === "string") {
      return value.split(",").map((s) => s.trim()).filter(Boolean);
    }
    return [];
  };

  const structured = {
    candidate_name: pick("candidate_name", "student_name") || "-",
    eligibility_status: pick("eligibility_status", "eligibility") || "-",
    skill_match_percentage: Number(pick("skill_match_percentage", "skill_match") || 0),
    match_category: pick("match_category") || "-",
    recommended_role: pick("recommended_role", "suitable_role") || "-",
    strong_skills: asList(pick("strong_skills", "matched_skills")),
    skills_to_improve: asList(pick("skills_to_improve", "improvement_skills")),
    career_recommendation: pick("career_recommendation") || "-",
    learning_roadmap: pick("learning_roadmap") || [],
    project_recommendations: pick("project_recommendations") || [],
    best_project: pick("best_project") || "-",
    best_project_reason: pick("best_project_reason") || "-"
  };

  const hasAnyStructuredData =
    structured.eligibility_status !== "-" ||
    structured.skill_match_percentage > 0 ||
    structured.recommended_role !== "-";

  if (!hasAnyStructuredData) {
    const textReport = pick("career_report", "text", "output", "result");
    if (textReport) {
      structured.career_recommendation = textReport;
    }
  }

  return structured;
}

/* =========================================================
   7. LOADING STATE
   ========================================================= */

function showLoading() {
  analyzeBtn.disabled = true;
  analyzeBtn.querySelector(".btn-label").textContent = "Analyzing...";
  loadingState.classList.remove("d-none");

  let index = 0;
  loadingMessage.textContent = LOADING_MESSAGES[index];

  loadingIntervalId = setInterval(() => {
    index = (index + 1) % LOADING_MESSAGES.length;
    loadingMessage.textContent = LOADING_MESSAGES[index];
  }, 900);
}

function hideLoading() {
  analyzeBtn.disabled = false;
  analyzeBtn.querySelector(".btn-label").textContent = "Analyze My Profile";
  loadingState.classList.add("d-none");

  if (loadingIntervalId) {
    clearInterval(loadingIntervalId);
    loadingIntervalId = null;
  }
}

/* =========================================================
   8. RESULTS RENDERING
   ========================================================= */

function showResults() {
  resultsSection.classList.remove("d-none");
  resultsSection.scrollIntoView({ behavior: "smooth" });
}

function resetResults() {
  resultsSection.classList.add("d-none");
  document.getElementById("skillProgressBar").style.width = "0%";
  document.getElementById("resSkillMatchPercentLabel").textContent = "0%";
  document.getElementById("strongSkillsContainer").innerHTML = "";
  document.getElementById("improveSkillsContainer").innerHTML = "";
  document.getElementById("roadmapContainer").innerHTML = "";
  document.getElementById("projectsContainer").innerHTML = "";
}

function renderResults(result, isDemo) {
  const badge = document.getElementById("resultModeBadge");
  if (isDemo) {
    badge.textContent = "Demo Result";
    badge.className = "badge rounded-pill bg-warning text-dark";
  } else {
    badge.textContent = "AI Analysis Generated";
    badge.className = "badge rounded-pill bg-success";
  }

  document.getElementById("resEligibility").textContent = result.eligibility_status || "-";
  document.getElementById("resCategory").textContent = result.match_category || "-";
  document.getElementById("resRole").textContent = result.recommended_role || "-";

  const percent = Math.max(0, Math.min(100, Number(result.skill_match_percentage) || 0));
  document.getElementById("resSkillMatch").textContent = percent + "%";
  document.getElementById("resSkillMatchPercentLabel").textContent = percent + "%";

  const progressBar = document.getElementById("skillProgressBar");
  progressBar.style.width = percent + "%";
  progressBar.parentElement.setAttribute("aria-valuenow", String(percent));

  document.getElementById("resCareerRecommendation").textContent =
    result.career_recommendation || "-";

  renderSkills(result.strong_skills, result.skills_to_improve);
  renderRoadmap(result.learning_roadmap);
  renderProjects(result.project_recommendations, result.best_project, result.best_project_reason);
}

function renderSkills(strongSkills, improveSkills) {
  const strongContainer = document.getElementById("strongSkillsContainer");
  const improveContainer = document.getElementById("improveSkillsContainer");

  strongContainer.innerHTML = "";
  improveContainer.innerHTML = "";

  (strongSkills || []).forEach((skill) => {
    const span = document.createElement("span");
    span.className = "skill-badge-strong";
    span.textContent = skill;
    strongContainer.appendChild(span);
  });

  (improveSkills || []).forEach((skill) => {
    const span = document.createElement("span");
    span.className = "skill-badge-improve";
    span.textContent = skill;
    improveContainer.appendChild(span);
  });

  if (!strongSkills || strongSkills.length === 0) {
    strongContainer.innerHTML = '<span class="text-muted small">No matched skills found.</span>';
  }
  if (!improveSkills || improveSkills.length === 0) {
    improveContainer.innerHTML = '<span class="text-muted small">No improvement areas identified.</span>';
  }
}

function renderRoadmap(roadmap) {
  const container = document.getElementById("roadmapContainer");
  container.innerHTML = "";

  if (!roadmap || roadmap.length === 0) {
    container.innerHTML = '<p class="text-muted">No roadmap data available.</p>';
    return;
  }

  roadmap.forEach((item) => {
    const col = document.createElement("div");
    col.className = "col-md-6 col-lg-3";

    col.innerHTML = `
      <div class="card roadmap-card p-3">
        <div class="d-flex align-items-center mb-3">
          <div class="roadmap-week-badge me-2">
            <i class="bi bi-calendar-week"></i>
          </div>
          <h6 class="fw-bold mb-0">${escapeHtml(item.week || "")}</h6>
        </div>
        <p class="mb-1 fw-semibold small">${escapeHtml(item.skill || "")}</p>
        <p class="text-muted small mb-0">${escapeHtml(item.what_to_learn || "")}</p>
      </div>
    `;
    container.appendChild(col);
  });
}

function renderProjects(projects, bestProject, bestProjectReason) {
  const container = document.getElementById("projectsContainer");
  container.innerHTML = "";

  if (!projects || projects.length === 0) {
    container.innerHTML = '<p class="text-muted">No project recommendations available.</p>';
  } else {
    projects.forEach((project) => {
      const isBest = bestProject && project.name === bestProject;
      const col = document.createElement("div");
      col.className = "col-md-6 col-lg-4";

      const techBadges = (project.technologies || [])
        .map((t) => `<span class="badge bg-success-subtle text-success-emphasis me-1 mb-1">${escapeHtml(t)}</span>`)
        .join("");

      const skillsText = (project.skills_developed || []).join(", ");

      col.innerHTML = `
        <div class="card project-card p-3 ${isBest ? "best-pick" : ""}">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <h6 class="fw-bold mb-0">${escapeHtml(project.name || "")}</h6>
            ${isBest ? '<span class="badge bg-success"><i class="bi bi-star-fill"></i></span>' : ""}
          </div>
          <p class="text-muted small mb-2">${escapeHtml(project.description || "")}</p>
          <div class="mb-2">${techBadges}</div>
          <p class="small mb-0"><strong>Skills Developed:</strong> ${escapeHtml(skillsText)}</p>
        </div>
      `;
      container.appendChild(col);
    });
  }

  document.getElementById("resBestProject").textContent = bestProject || "-";
  document.getElementById("resBestProjectReason").textContent = bestProjectReason || "-";
}

/* =========================================================
   9. ALERTS / ERROR HANDLING
   ========================================================= */

function showAlert(message, type) {
  formAlertContainer.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      ${escapeHtml(message)}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
  `;
}

function clearAlert() {
  formAlertContainer.innerHTML = "";
}

function showError(message) {
  showAlert(message, "danger");
}

/* =========================================================
   10. UTILITIES
   ========================================================= */

function escapeHtml(str) {
  if (typeof str !== "string") return str;
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}