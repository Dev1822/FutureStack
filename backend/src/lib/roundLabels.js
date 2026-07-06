/** Keep in sync with src/utils/roundHelpers.js ROUND_TYPE_LABELS */
const ROUND_TYPE_LABELS = {
    resume_shortlisted: 'Resume Shortlisted',
    oa: 'Online Assessment',
    assignment: 'Assignment',
    technical_assignment: 'Technical Assignment',
    technical: 'Technical Interview',
    hr: 'HR Interview',
    group_discussion: 'Group Discussion',
    managerial: 'Managerial',
    final: 'Final Round',
    other: 'Other'
};

function getRoundTypeLabel(roundType) {
    return ROUND_TYPE_LABELS[roundType] || roundType;
}

module.exports = {
    ROUND_TYPE_LABELS,
    getRoundTypeLabel
};
