const fs = require('fs');

const filesToFix = [
  'src/pages/Documents.jsx',
  'src/components/hackathons/TaskBoard.jsx',
  'src/components/statusboard/StatusCard.jsx',
  'src/components/hackathons/IdeaBrainstormingBoard.jsx',
  'src/components/documents/DocumentUpload.jsx',
  'src/components/documents/DocumentSelector.jsx',
  'src/components/documents/AiSettingsModal.jsx'
];

filesToFix.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace bg-gray-900 with bg-white dark:bg-gray-900, if not already dark:
    content = content.replace(/(?<!dark:)bg-gray-900/g, 'bg-white dark:bg-gray-900');
    
    // Also fix the hardcoded style options in Documents.jsx
    content = content.replace(/style=\{\{\s*backgroundColor:\s*'#111827',\s*color:\s*'white'\s*\}\}/g, 'className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white"');
    
    fs.writeFileSync(file, content);
    console.log('Fixed', file);
  }
});
