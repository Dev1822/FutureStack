/**
 * Convert structured resume + GitHub data into narrative text for evaluation.
 * Mirrors convert_json_resume_to_text / convert_github_data_to_text from
 * interviewstreet/hiring-agent (MIT © HackerRank).
 */

'use strict';

const CATEGORY_MAX = {
    open_source: 35,
    self_projects: 30,
    production: 25,
    technical_skills: 10,
};

function convertStructuredResumeToText(structuredResume) {
    const parts = [];
    const resume = structuredResume || {};
    const basics = resume.basics || {};

    parts.push('=== BASIC INFORMATION ===');
    parts.push(`Name: ${basics.name || 'Not provided'}`);
    parts.push(`Email: ${basics.email || 'Not provided'}`);
    parts.push(`Phone: ${basics.phone || 'Not provided'}`);
    if (basics.location) parts.push(`Location: ${basics.location}`);
    if (basics.summary) parts.push(`Summary: ${basics.summary}`);

    if (Array.isArray(basics.profiles) && basics.profiles.length > 0) {
        parts.push('Profiles:');
        for (const profile of basics.profiles) {
            const network = profile.network || 'Profile';
            parts.push(`  - ${network}: ${profile.url || 'N/A'}`);
        }
    }

    if (Array.isArray(resume.work) && resume.work.length > 0) {
        parts.push('\n=== WORK EXPERIENCE ===');
        resume.work.forEach((work, index) => {
            parts.push(`${index + 1}. ${work.position || 'Role'} at ${work.company || 'Company'}`);
            parts.push(`   Period: ${work.startDate || '?'} - ${work.endDate || 'Present'}`);
            for (const highlight of work.highlights || []) {
                parts.push(`   • ${highlight}`);
            }
        });
    }

    if (Array.isArray(resume.education) && resume.education.length > 0) {
        parts.push('\n=== EDUCATION ===');
        resume.education.forEach((edu, index) => {
            parts.push(`${index + 1}. ${edu.studyType || 'Degree'} in ${edu.area || 'Field'}`);
            parts.push(`   Institution: ${edu.institution || 'N/A'}`);
            parts.push(`   Period: ${edu.startDate || '?'} - ${edu.endDate || '?'}`);
            if (edu.score) parts.push(`   Score: ${edu.score}`);
            if (edu.courses?.length) parts.push(`   Courses: ${edu.courses.join(', ')}`);
        });
    }

    const skills = resume.skills || {};
    const technical = skills.technical || [];
    const soft = skills.soft || [];
    const languages = skills.languages || [];
    if (technical.length || soft.length || languages.length) {
        parts.push('\n=== SKILLS ===');
        if (technical.length) parts.push(`Technical: ${technical.join(', ')}`);
        if (soft.length) parts.push(`Soft: ${soft.join(', ')}`);
        if (languages.length) parts.push(`Languages: ${languages.join(', ')}`);
    }

    if (Array.isArray(resume.projects) && resume.projects.length > 0) {
        parts.push('\n=== PROJECTS ===');
        resume.projects.forEach((project, index) => {
            parts.push(`${index + 1}. ${project.name || 'Project'}`);
            if (project.url) parts.push(`   URL: ${project.url}`);
            if (project.description) parts.push(`   Description: ${project.description}`);
            if (project.keywords?.length) parts.push(`   Technologies: ${project.keywords.join(', ')}`);
            for (const highlight of project.highlights || []) {
                parts.push(`   • ${highlight}`);
            }
        });
    }

    if (Array.isArray(resume.awards) && resume.awards.length > 0) {
        parts.push('\n=== AWARDS ===');
        resume.awards.forEach((award, index) => {
            parts.push(`${index + 1}. ${award.title || 'Award'} (${award.date || 'N/A'})`);
            if (award.awarder) parts.push(`   Issuer: ${award.awarder}`);
            if (award.summary) parts.push(`   ${award.summary}`);
        });
    }

    return parts.join('\n');
}

function convertGithubDataToText(githubSummary) {
    if (!githubSummary) return '';

    const lines = ['\n\n=== GITHUB DATA ==='];
    lines.push('GitHub Profile:');
    lines.push(`- Username: ${githubSummary.username || 'N/A'}`);
    lines.push(`- Public Repositories: ${githubSummary.publicRepos ?? 'N/A'}`);
    lines.push(`- Followers: ${githubSummary.followers ?? 'N/A'}`);
    lines.push(`- Total Stars (owned repos): ${githubSummary.totalStars ?? 'N/A'}`);

    const projects = githubSummary.projects || githubSummary.allReposMeta || [];
    if (projects.length > 0) {
        lines.push(`\nGitHub Projects (${projects.length} evaluated):`);
        projects.slice(0, 10).forEach((project, index) => {
            lines.push(`${index + 1}. ${project.name || 'N/A'}`);
            lines.push(`   Description: ${project.description || 'N/A'}`);
            lines.push(`   URL: ${project.github_url || project.url || 'N/A'}`);
            lines.push(`   project_type: ${project.project_type || (project.isOwner === false ? 'open_source' : 'self_project')}`);
            lines.push(`   author_commit_count: ${project.author_commit_count ?? 'N/A'}`);
            lines.push(`   contributor_count: ${project.contributor_count ?? 'N/A'}`);
            lines.push(`   Stars: ${project.stars ?? project.github_details?.stars ?? 0}`);
            lines.push(`   Forks: ${project.forks ?? project.github_details?.forks ?? 0}`);
            lines.push(`   Language: ${project.language ?? project.github_details?.language ?? 'N/A'}`);
            lines.push('');
        });
    }

    return lines.join('\n');
}

function buildEvaluationText(structuredResume, githubSummary) {
    return convertStructuredResumeToText(structuredResume) + convertGithubDataToText(githubSummary);
}

module.exports = {
    CATEGORY_MAX,
    convertStructuredResumeToText,
    convertGithubDataToText,
    buildEvaluationText,
};
