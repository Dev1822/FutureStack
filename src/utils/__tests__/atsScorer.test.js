import {
  analyzeText,
  getAtsAnalysisErrorMessage,
  inferResumeFileName,
  isAtsEligible
} from '../atsScorer';

test('analyzeText returns scores and breakdown', () => {
  const sample = `John Doe\nEmail: john@example.com\nPhone: +1 555 1234\n\nEducation\nBachelor of Science\n\nSkills\nJavaScript, React, Node.js, AWS\n\nExperience\n- Worked at Company A\n- Worked at Company B\n\nProjects\n- Project X`;

  const res = analyzeText(sample);
  expect(res).toHaveProperty('score');
  expect(res).toHaveProperty('breakdown');
  expect(res.breakdown).toHaveProperty('structure');
  expect(res.breakdown.structure).toBeLessThanOrEqual(60);
  expect(res.breakdown.content).toBeLessThanOrEqual(25);
  expect(res.breakdown.atsFriendly).toBeLessThanOrEqual(15);
  expect(res.matchedKeywords).toContain('javascript');
  expect(res).toHaveProperty('missingSections');
  expect(res).toHaveProperty('suggestions');
  expect(res).toHaveProperty('howScored');
});

test('analyzeText reports missing sections and suggestions for sparse text', () => {
  const res = analyzeText('Jane Doe jane@example.com');

  expect(res.score).toBeGreaterThanOrEqual(0);
  expect(res.missingSections).toEqual(expect.arrayContaining(['Education', 'Skills', 'Experience', 'Projects']));
  expect(res.suggestions.length).toBeGreaterThan(0);
});

test('isAtsEligible only allows uploaded resume files', () => {
  expect(isAtsEligible({
    type: 'resume',
    file_url: 'https://example.com/resume.pdf',
    is_external: false
  })).toBe(true);

  expect(isAtsEligible({
    type: 'resume',
    file_url: 'https://example.com/resume.pdf',
    is_external: true
  })).toBe(false);

  expect(isAtsEligible({
    type: 'cover_letter',
    file_url: 'https://example.com/cover.pdf',
    is_external: false
  })).toBe(false);
});

test('inferResumeFileName prefers URL extension and falls back to document name', () => {
  expect(inferResumeFileName({
    name: 'My Resume',
    file_url: 'https://example.com/storage/resume-final.docx?token=abc'
  })).toBe('resume-final.docx');

  expect(inferResumeFileName({
    name: 'Engineer Resume',
    file_url: 'https://example.com/storage/file?token=abc'
  })).toBe('Engineer Resume.pdf');
});

test('getAtsAnalysisErrorMessage maps known analysis failures', () => {
  expect(getAtsAnalysisErrorMessage(new Error('no_text_extracted')))
    .toMatch(/Scanned PDFs are not supported/i);
  expect(getAtsAnalysisErrorMessage(new Error('fetch_failed')))
    .toMatch(/download the resume file/i);
});
