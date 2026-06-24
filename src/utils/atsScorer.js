/*
 * Client-side ATS scorer and text extractor
 * - analyzeFile(file): tries to extract text from PDF/DOCX and returns analysis
 * - analyzeText(text): rule-based scoring returning breakdown and total (0-100)
 */
import mammoth from 'mammoth';

export const KEYWORDS = [
  'javascript', 'react', 'node', 'python', 'java', 'sql', 'html', 'css',
  'typescript', 'express', 'mongodb', 'postgresql', 'docker', 'kubernetes',
  'aws', 'azure', 'git', 'github', 'linux', 'rest api', 'graphql', 'testing',
  'ci/cd', 'agile', 'machine learning', 'data structures', 'algorithms'
];

const SECTION_LABELS = {
  contact: 'Contact',
  education: 'Education',
  skills: 'Skills',
  experience: 'Experience',
  projects: 'Projects'
};

const HOW_SCORED = [
  'Structure: 60 points for Contact, Education, Skills, Experience, and Projects.',
  'Content: 25 points for skills depth, projects, and experience bullets.',
  'ATS-friendly: 15 points for resume length, contact details, and LinkedIn/GitHub signals.',
  'Keywords use a static v1 list and do not affect the score.'
];

const buildSuggestions = ({
  sections,
  skillsDepthScore,
  projectsScore,
  experienceScore,
  lengthScore,
  hasEmail,
  hasLinked,
  suggestedKeywords
}) => {
  const suggestions = [];
  Object.entries(sections).forEach(([key, present]) => {
    if (!present) suggestions.push(`Add a clear ${SECTION_LABELS[key]} section.`);
  });
  if (skillsDepthScore < 8) suggestions.push('List more role-relevant skills with clear separators.');
  if (projectsScore < 4) suggestions.push('Include 1-2 projects with impact, stack, and links if available.');
  if (experienceScore < 3) suggestions.push('Use concise bullet points under experience with action verbs and results.');
  if (lengthScore < 7) suggestions.push('Aim for roughly 400-1000 words for a readable resume.');
  if (!hasEmail) suggestions.push('Add a professional email address.');
  if (!hasLinked) suggestions.push('Add LinkedIn and/or GitHub profile links.');
  if (suggestedKeywords.length > 0) {
    suggestions.push(`Consider relevant keywords: ${suggestedKeywords.slice(0, 5).join(', ')}.`);
  }
  return suggestions.slice(0, 5);
};

export function analyzeText(text = '') {
  const normalized = (text || '').toLowerCase();

  // Structure scoring (60): Contact, Education, Skills, Experience, Projects
  const sections = {
    contact: /contact|email|phone|address|linkedin|github/.test(normalized),
    education: /education|degree|bachelor|master|phd|university/.test(normalized),
    skills: /skills?|technical skills|proficiencies|stack/.test(normalized),
    experience: /experience|employment|work history|professional experience/.test(normalized),
    projects: /project[s]?|portfolio|personal projects/.test(normalized)
  };

  const structurePerSection = 60 / Object.keys(sections).length; // 12 each
  let structureScore = 0;
  Object.values(sections).forEach(present => { if (present) structureScore += structurePerSection; });

  // Content (25) - simple heuristics
  // skills depth: count occurrences of common skill separators in skills section
  let skillsDepthScore = 0;
  const skillsMatch = normalized.match(/skills[\s\S]{0,300}/) || [];
  const skillsText = skillsMatch[0] || '';

  if (skillsText && skillsText.length > 50) {
    skillsDepthScore = Math.min(12, Math.floor((skillsText.split(/[,\n]/).length / 6) * 12));
  }

  // projects: count occurrences of 'project' headings
  const projectsCount = (normalized.match(/project[s]?/g) || []).length;
  const projectsScore = Math.min(8, Math.floor((projectsCount / 2) * 8));

  // experience bullets: approximate common bullet markers in the experience section
  const experienceMatch = normalized.match(/experience[\s\S]{0,800}/) || [];
  const experienceText = experienceMatch[0] || '';
  const expBullets = (experienceText.match(/\n\s*[-*]\s+/g) || []).length;
  const experienceScore = Math.min(5, Math.floor((expBullets / 6) * 5));

  const contentScore = Math.round(skillsDepthScore + projectsScore + experienceScore);

  // ATS-friendly (15)
  // length: ideal 400-1000 words
  const words = (normalized.match(/\w+/g) || []).length;
  let lengthScore = 0;
  if (words >= 400 && words <= 1000) lengthScore = 10;
  else if (words >= 250 && words < 400) lengthScore = 7;
  else if (words > 1000 && words <= 1500) lengthScore = 7;
  else if (words >= 100 && words < 250) lengthScore = 4;

  // contact details
  const hasEmail = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/.test(normalized);
  const hasPhone = /(?:\+?\d[\d\s\-().]{7,}\d)/.test(normalized);
  const hasLinked = /linkedin\.com|github\.com/.test(normalized);

  const contactScore = (hasEmail ? 3 : 0) + (hasPhone ? 1 : 0) + (hasLinked ? 1 : 0); // total 5
  const atsFriendlyScore = lengthScore + contactScore; // max 15

  // Keywords (not in main score) - static list
  const matchedKeywords = KEYWORDS.filter(keyword => normalized.includes(keyword));
  const suggestedKeywords = KEYWORDS.filter(keyword => !matchedKeywords.includes(keyword));

  const total = Math.max(0, Math.min(100, Math.round(structureScore + contentScore + atsFriendlyScore)));

  const breakdown = {
    structure: Math.round(structureScore),
    content: contentScore,
    atsFriendly: atsFriendlyScore
  };
  const missingSections = Object.entries(sections)
    .filter(([, present]) => !present)
    .map(([key]) => SECTION_LABELS[key]);

  return {
    score: total,
    breakdown,
    words,
    sections,
    missingSections,
    suggestions: buildSuggestions({
      sections,
      skillsDepthScore,
      projectsScore,
      experienceScore,
      lengthScore,
      hasEmail,
      hasLinked,
      suggestedKeywords
    }),
    matchedKeywords,
    suggestedKeywords,
    howScored: HOW_SCORED
  };
}

export async function extractTextFromPDF(arrayBuffer) {
  try {
    const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist/legacy/build/pdf.mjs');
    GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
    const loadingTask = getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items.map(item => item.str);
      text += strings.join(' ') + '\n';
    }
    return text;
  } catch (err) {
    console.error('PDF extraction failed', err);
    throw err;
  }
}

export async function extractTextFromDocx(arrayBuffer) {
  try {
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value || '';
  } catch (err) {
    console.error('DOCX extraction failed', err);
    throw err;
  }
}

export function isAtsEligible(document) {
  return Boolean(
    document?.type === 'resume' &&
    document?.file_url &&
    !document?.is_external
  );
}

export function inferResumeFileName(document) {
  const url = document?.file_url || '';
  const fromUrl = url.split('?')[0].split('/').pop() || '';
  if (/\.(pdf|docx?)$/i.test(fromUrl)) {
    return fromUrl;
  }

  const baseName = (document?.name || 'resume').replace(/\.[^/.]+$/, '');
  if (/\.docx?(\?|$)/i.test(url)) {
    return `${baseName}.docx`;
  }
  return `${baseName}.pdf`;
}

export function getAtsAnalysisErrorMessage(error) {
  if (error?.message === 'no_text_extracted') {
    return "Couldn't read text from this file. Scanned PDFs are not supported yet.";
  }
  if (error?.message === 'fetch_failed') {
    return 'Unable to download the resume file. Please try again.';
  }
  if (error?.message === 'extraction_failed') {
    return 'Unable to analyze the resume. Please try another PDF or DOCX file.';
  }
  return 'Unable to analyze the resume. Please try again.';
}

export async function analyzeFileFromUrl(fileUrl, fileName = 'resume.pdf') {
  if (!fileUrl) {
    throw new Error('fetch_failed');
  }

  const response = await fetch(fileUrl);
  if (!response.ok) {
    throw new Error('fetch_failed');
  }

  const blob = await response.blob();
  const file = new File([blob], fileName, {
    type: blob.type || 'application/pdf'
  });

  return analyzeFile(file);
}

export async function analyzeFile(file) {
  if (!file) throw new Error('No file provided');

  const reader = new FileReader();
  const arrayBuffer = await new Promise((resolve, reject) => {
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });

  const mime = file.type || '';
  let text = '';
  try {
    if (mime === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      text = await extractTextFromPDF(arrayBuffer);
    } else if (mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.toLowerCase().endsWith('.docx')) {
      text = await extractTextFromDocx(arrayBuffer);
    } else if (mime === 'application/msword' || file.name.toLowerCase().endsWith('.doc')) {
      // mammoth can handle .doc via conversion in some environments; try
      try {
        text = await extractTextFromDocx(arrayBuffer);
      } catch (e) {
        text = '';
      }
    }
  } catch (err) {
    // extraction error
    throw new Error('extraction_failed');
  }

  if (!text || text.trim().length < 20) {
    // likely scanned PDF or could not extract
    throw new Error('no_text_extracted');
  }

  return analyzeText(text);
}

const atsScorer = { analyzeText, analyzeFile };
export default atsScorer;
