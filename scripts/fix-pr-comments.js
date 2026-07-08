const fs = require('fs');

function replaceInFile(file, replacements) {
    if (!fs.existsSync(file)) return;
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;
    
    replacements.forEach(({ search, replace }) => {
        content = content.replace(search, replace);
    });
    
    if (content !== originalContent) {
        fs.writeFileSync(file, content);
        console.log('Fixed', file);
    }
}

// 1. Fix hover:text-white issues
const filesWithHoverIssues = [
    'src/components/interview-prep/BehavioralPrepPanel.jsx',
    'src/components/interview-prep/InterviewQuestionsPanel.jsx',
    'src/components/interview-prep/TechnicalTopicsPanel.jsx',
    'src/components/opportunities/OpportunityDetailModal.jsx',
    'src/components/statusboard/StatusCard.jsx',
    'src/pages/HackathonDetail.jsx',
    'src/pages/InterviewPrepDetail.jsx'
];

filesWithHoverIssues.forEach(file => {
    replaceInFile(file, [
        {
            search: /hover:text-white hover:bg-white\/10/g,
            replace: 'hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10'
        },
        {
            search: /hover:text-white hover:bg-white\/5/g,
            replace: 'hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
        },
        {
            search: /hover:text-white mb-6/g,
            replace: 'hover:text-gray-900 dark:hover:text-white mb-6'
        },
        {
            search: /hover:text-white transition-colors/g,
            replace: 'hover:text-gray-900 dark:hover:text-white transition-colors'
        }
    ]);
});

// 2. Fix Analytics.jsx
replaceInFile('src/pages/Analytics.jsx', [
    {
        search: /className="h-8 bg-gray-800 rounded/g,
        replace: 'className="h-8 bg-gray-200 dark:bg-gray-800 rounded'
    },
    {
        search: /className="h-4 bg-gray-800 rounded/g,
        replace: 'className="h-4 bg-gray-200 dark:bg-gray-800 rounded'
    },
    {
        search: /className="h-24 bg-gray-800\/50 rounded/g,
        replace: 'className="h-24 bg-gray-200 dark:bg-gray-800/50 rounded'
    },
    {
        search: /className="bg-gray-900\/95 backdrop-blur-sm px-4 py-2 rounded-lg border border-gray-200 dark:border-white\/10"/g,
        replace: 'className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-xl px-4 py-2 rounded-lg border border-gray-200 dark:border-white/10"'
    }
]);

// 3. Fix ShareProgressModal.jsx
replaceInFile('src/components/sharing/ShareProgressModal.jsx', [
    {
        search: /text-gray-400 hover:text-gray-200/g,
        replace: 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
    }
]);

// 4. Fix Reports.jsx
replaceInFile('src/pages/Reports.jsx', [
    {
        search: /border-gray-200 dark:border-white\/10 bg-black\/5 dark:bg-white\/5 hover:border-white\/20 hover:bg-white\/\[0\.07\]/g,
        replace: 'border-gray-200 dark:border-white/10 bg-black/5 dark:bg-white/5 hover:border-gray-400 dark:hover:border-white/20 hover:bg-black/10 dark:hover:bg-white/[0.07]'
    },
    {
        search: /text-gray-200/g,
        replace: 'text-gray-700 dark:text-gray-200'
    }
]);

console.log('All automated replacements done.');
