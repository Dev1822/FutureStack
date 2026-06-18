/**
 * Interview round display helpers (aligned with backend rounds-schemas.js)
 */

export const ROUND_TYPES = [
  'resume_shortlisted',
  'oa',
  'assignment',
  'technical_assignment',
  'technical',
  'hr',
  'group_discussion',
  'managerial',
  'final',
  'other',
];

export const ROUND_RESULTS = ['pending', 'cleared', 'rejected', 'skipped'];

export const ROUND_TYPE_LABELS = {
  resume_shortlisted: 'Resume Shortlisted',
  oa: 'Online Assessment',
  assignment: 'Assignment',
  technical_assignment: 'Technical Assignment',
  technical: 'Technical Interview',
  hr: 'HR Interview',
  group_discussion: 'Group Discussion',
  managerial: 'Managerial',
  final: 'Final Round',
  other: 'Other',
};

export const ROUND_RESULT_LABELS = {
  pending: 'Pending',
  cleared: 'Cleared',
  rejected: 'Rejected',
  skipped: 'Skipped',
};

export const ROUND_RESULT_STYLES = {
  pending: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  cleared: 'bg-green-500/10 text-green-400 border-green-500/20',
  rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
  skipped: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
};

export const supportsInterviewRounds = (category) => category === 'internship';

export const getRoundTypeLabel = (roundType) =>
  ROUND_TYPE_LABELS[roundType] || roundType;

export const getRoundResultLabel = (result) =>
  ROUND_RESULT_LABELS[result] || result;

/**
 * Compact card label from synced opportunity fields.
 */
export const getRoundSummaryLabel = (opportunity) => {
  if (!opportunity || !supportsInterviewRounds(opportunity.category)) {
    return null;
  }

  if (opportunity.rejected_round_number) {
    return `Rejected at Round ${opportunity.rejected_round_number}`;
  }

  if (opportunity.current_round_number) {
    return `Round ${opportunity.current_round_number} · In progress`;
  }

  return null;
};

export const getNextRoundNumber = (rounds) => {
  if (!rounds?.length) return 1;
  return Math.max(...rounds.map((r) => r.round_number)) + 1;
};

export const NOTES_MAX_LENGTH = 5000;

/**
 * Aggregate stats for pipeline header / progress bar.
 */
export const getRoundProgressStats = (rounds = []) => {
  const sorted = [...rounds].sort((a, b) => a.round_number - b.round_number);
  const total = sorted.length;
  const cleared = sorted.filter((r) => r.result === 'cleared').length;
  const pending = sorted.filter((r) => r.result === 'pending').length;
  const skipped = sorted.filter((r) => r.result === 'skipped').length;
  const hasRejection = sorted.some((r) => r.result === 'rejected');
  const completed = cleared + skipped;
  const progressPercent = total === 0 ? 0 : Math.round((completed / total) * 100);

  return { total, cleared, pending, skipped, hasRejection, completed, progressPercent };
};

/** Card badge Tailwind classes keyed off synced opportunity fields. */
export const getRoundSummaryStyle = (opportunity) => {
  if (opportunity?.rejected_round_number) {
    return 'bg-red-500/10 text-red-300 border-red-500/20';
  }
  if (opportunity?.current_round_number) {
    return 'bg-purple-500/10 text-purple-300 border-purple-500/20';
  }
  return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
};

export const ROUND_RESULT_HINTS = {
  pending: 'Scheduled or awaiting outcome',
  cleared: 'Passed — you can add the next round',
  rejected: 'Marks the pipeline as rejected — internship moves out of your active list',
  skipped: 'Round was cancelled or not required',
};
