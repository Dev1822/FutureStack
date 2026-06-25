/**
 * Resume agent prompt templates.
 *
 * Ported from interviewstreet/hiring-agent (MIT © HackerRank) Jinja templates:
 *   - resume_evaluation_system_message.jinja
 *   - resume_evaluation_criteria.jinja
 */

'use strict';

// ---------------------------------------------------------------------------
// Extraction prompts
// ---------------------------------------------------------------------------

const SYSTEM_EXTRACTION = `You are a precise resume parser.
Extract information exactly as written. Do not infer, invent or summarise.
Return only valid JSON that matches the requested schema.
If a field is absent in the resume, return null or an empty array as appropriate.`;

function buildExtractionPrompt(section, resumeText) {
    const sectionInstructions = {
        basics: `Extract the candidate's basic information:
- name (full name)
- email address
- phone number (or null)
- location (city, state/country or null)
- summary / objective paragraph (or null)
- profiles: array of { network, url } for LinkedIn, GitHub, portfolio, etc.`,

        work: `Extract ALL work experience entries as an array.
Each entry must contain:
- company (string)
- position / title (string)
- startDate (string, e.g. "2022-06" or "Jun 2022", or null)
- endDate (string or "Present" if current)
- highlights: array of bullet-point strings describing responsibilities/achievements`,

        education: `Extract ALL education entries as an array.
Each entry must contain:
- institution (string)
- area / field of study (string or null)
- studyType (e.g. "B.Tech", "B.S.", "M.S." or null)
- startDate (string or null)
- endDate (string or null)
- score / GPA (string or null)
- courses: array of notable course names (empty array if none mentioned)`,

        skills: `Extract ALL technical and soft skills mentioned.
Return:
- technical: array of skill strings (programming languages, frameworks, tools, etc.)
- soft: array of soft skill strings
- languages: array of spoken/written language strings (not programming languages)`,

        projects: `Extract ALL personal or academic projects mentioned (not work experience).
Each entry must contain:
- name (string)
- description (string or null)
- url (string or null)
- startDate (string or null)
- endDate (string or null)
- highlights: array of bullet strings
- keywords: array of technology/skill keywords used`,

        awards: `Extract any awards, certifications, publications, or recognitions.
Each entry must contain:
- title (string)
- date (string or null)
- awarder / issuer (string or null)
- summary (string or null)`,
    };

    const instruction = sectionInstructions[section] || `Extract the "${section}" section.`;

    return `${instruction}

--- RESUME TEXT START ---
${resumeText}
--- RESUME TEXT END ---

Return only the JSON object for this section. No markdown, no explanation.`;
}

function buildFullExtractionPrompt(resumeText) {
    return `Parse the entire resume into a single JSON Resume object with these sections:

1. basics — { name, email, phone, location, summary, profiles: [{ network, url }] }
2. work — array of { company, position, startDate, endDate, highlights[] }
3. education — array of { institution, area, studyType, startDate, endDate, score, courses[] }
4. skills — { technical[], soft[], languages[] } (languages = spoken/written, not programming)
5. projects — array of { name, description, url, startDate, endDate, highlights[], keywords[] }
6. awards — array of { title, date, awarder, summary }

Extract only what is written. Use null or empty arrays when a section is absent.

--- RESUME TEXT START ---
${resumeText}
--- RESUME TEXT END ---

Return only the JSON object. No markdown, no explanation.`;
}

// ---------------------------------------------------------------------------
// GitHub project-selection prompt
// ---------------------------------------------------------------------------

const SYSTEM_GITHUB = `You are a senior software engineer evaluating open-source contributions.
Analyse repository metadata and select the most impressive projects.
Return only valid JSON.`;

function buildGithubSelectionPrompt(repos) {
    return `From the following GitHub repositories, select up to 7 that best demonstrate
technical depth, impact, and meaningful authorship. Prefer:
1. Repositories with significant commit counts by the author (author_commit_count)
2. Repositories that are original work (project_type: self_project) or meaningful OSS (open_source)
3. Repositories that show real-world or production use

Return a JSON object with a "selected" array of repository names only (strings).

Repositories:
${JSON.stringify(repos, null, 2)}`;
}

// ---------------------------------------------------------------------------
// Evaluation prompts (hiring-agent rubric)
// ---------------------------------------------------------------------------

const SYSTEM_EVALUATION = `You are an expert technical recruiter evaluating resumes. Provide accurate, objective evaluations based on the given criteria.

**CRITICAL: You are NOT writing a resume summary. You are SCORING a resume for a job application.**

**CRITICAL FAIRNESS REQUIREMENTS:**
**SCORES MUST NEVER DEPEND ON THE FOLLOWING FACTORS:**
- Candidate's name, gender, or any personal demographic information
- College, university, or educational institution name
- CGPA, GPA, or academic grades
- City, location, or geographical information
- Any personal characteristics unrelated to technical skills and experience

**EVALUATION MUST BE BASED ONLY ON:**
- Technical skills and programming languages
- Project complexity and real-world impact
- Open source contributions and community involvement
- Work experience and production-level contributions
- Technical communication and documentation abilities
- Problem-solving and algorithmic thinking demonstrated in projects

**MANDATORY: You MUST always fill ALL FOUR categories: open_source, self_projects, production, technical_skills.**

- For open_source: Analyze all open source contributions, GitHub/GitLab activity, and community involvement. Look for Google Summer of Code (GSoC) and Girl Script Summer of Code participation. **CRITICAL**: Having personal GitHub repositories does NOT constitute open source contribution. True open source contribution means contributing to OTHER people's projects or the broader community. Personal repositories should receive low scores (5-10 points) unless they demonstrate exceptional complexity or community impact. **CRITICAL**: Hacktoberfest participation alone (without evidence of contributions to significant projects) should receive 5-8 points maximum. When GitHub data is provided, check the 'project_type' field — projects with 'open_source' type (multiple contributors) should receive higher scores than 'self_project' type (single contributor).

- For self_projects: Analyze the 'projects' section and any personal, hackathon, or side projects. **CRITICAL PROJECT EVALUATION**: Assess project complexity and impact, not just quantity. Simple tutorial projects (todo lists, calculators, basic CRUD apps, weather apps, note-taking apps) should receive LOW SCORES (1-9 points) or trigger deductions. **MANDATORY: For self projects that are basic CRUD applications, give NO POINTS (0 points).** Complex projects with real-world impact should receive HIGH SCORES (20-30 points). Projects without active links, GitHub repositories, or live demos should receive significantly lower scores.

- For production: Analyze the 'work' section for any real-world, internship, or production experience. **SPECIAL CONSIDERATION FOR STARTUP EXPERIENCE**: Give extra points for founder roles, co-founder positions, or early-stage engineer roles at startups.

- For technical_skills: Analyze the 'skills' section and evidence of technical breadth in projects, work, or competitions.

Return only valid JSON matching the exact structure specified in the user prompt.`;

function buildEvaluationPrompt(evaluationText) {
    return `You are evaluating a resume for a Software Intern position. Analyze the resume data and provide scores based on these criteria:

**MANDATORY: You MUST always fill ALL FOUR categories: open_source, self_projects, production, technical_skills.**

## SCORING CRITERIA

### Open Source (0-35 points)
- 25-35: Contributions to popular OSS, GSoC, substantial community involvement
- 15-24: Contributions to smaller OSS projects, meaningful activity on others' repos
- 5-10: Only personal GitHub repos with no contributions to other projects
- 0-4: No GitHub presence or only tutorial repos
- **CRITICAL**: When GitHub data shows all projects are 'self_project' type, open source score MUST be 10 points or less

### Self Projects (0-30 points)
- 20-30: Complex projects with real-world impact and advanced architecture
- 10-19: Moderate complexity, good documentation
- 1-9: Simple tutorial projects (todo, calculator, basic CRUD, weather apps)
- 0: No projects or only extremely basic projects
- Projects without URLs/GitHub/live demos should receive 30-50% lower scores

### Production (0-25 points)
- Real-world internships, jobs, production features
- Extra points for founder/co-founder or early startup engineer roles

### Technical Skills (0-10 points)
- Breadth and depth of stated skills with supporting evidence in projects/work

## BONUS POINTS (Maximum total: 20 points)
- +5 for Google Summer of Code (GSoC)
- +3 for Girl Script Summer of Code
- +3-5 for startup founder/co-founder experience
- +2-3 for early-stage engineer (first 10-20 employees)
- +1-3 for high-quality technical blogs (if provided)

## DEDUCTIONS
- -2 to -5 if resume contains only simple tutorial projects
- -3 to -5 per project without any GitHub link, live demo, or active URL
- -3 to -5 when GitHub data shows only personal repos with no true OSS contributions

**CATEGORY SCORE LIMITS (cannot be exceeded):**
- open_source: 0-35
- self_projects: 0-30
- production: 0-25
- technical_skills: 0-10
- bonus_points.total: 0-20
- Total (categories + bonus - deductions) cannot exceed 120

Return JSON with this EXACT structure:
{
  "scores": {
    "open_source": {"score": 0, "max": 35, "evidence": "string"},
    "self_projects": {"score": 0, "max": 30, "evidence": "string"},
    "production": {"score": 0, "max": 25, "evidence": "string"},
    "technical_skills": {"score": 0, "max": 10, "evidence": "string"}
  },
  "bonus_points": {"total": 0, "breakdown": "string"},
  "deductions": {"total": 0, "reasons": "string"},
  "key_strengths": ["up to 5 strings"],
  "areas_for_improvement": ["up to 3 strings"]
}

**DO NOT RETURN A RESUME SUMMARY. RETURN ONLY THE SCORING EVALUATION.**

Resume to evaluate:

${evaluationText}`;
}

module.exports = {
    SYSTEM_EXTRACTION,
    buildExtractionPrompt,
    buildFullExtractionPrompt,
    SYSTEM_GITHUB,
    buildGithubSelectionPrompt,
    SYSTEM_EVALUATION,
    buildEvaluationPrompt,
};
