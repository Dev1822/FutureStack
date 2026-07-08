const fs = require('fs');
const path = require('path');

const walkSync = function(dir, filelist) {
  if (!fs.existsSync(dir)) return filelist || [];
  let files = fs.readdirSync(dir);
  filelist = filelist || [];
  files.forEach(function(file) {
    if (fs.statSync(path.join(dir, file)).isDirectory()) {
      filelist = walkSync(path.join(dir, file), filelist);
    }
    else {
      if (file.endsWith('.jsx')) {
        filelist.push(path.join(dir, file));
      }
    }
  });
  return filelist;
};

let files = walkSync('./src/pages', []).concat(walkSync('./src/components', []));

const replacements = [
  { regex: /(?<!dark:)(?<!hover:)(?<!focus:)(?<!active:)\bbg-black\b/g, replacement: 'bg-white dark:bg-black' },
  { regex: /(?<!dark:)(?<!hover:)(?<!focus:)(?<!active:)\bbg-\[\#0a0a0a\]\b/g, replacement: 'bg-gray-50 dark:bg-[#0a0a0a]' },
  { regex: /(?<!dark:)(?<!hover:)(?<!focus:)(?<!active:)\bborder-white\/10\b/g, replacement: 'border-gray-200 dark:border-white/10' },
  { regex: /(?<!dark:)(?<!hover:)(?<!focus:)(?<!active:)\btext-gray-400\b/g, replacement: 'text-gray-600 dark:text-gray-400' },
  { regex: /(?<!dark:)(?<!hover:)(?<!focus:)(?<!active:)\btext-gray-300\b/g, replacement: 'text-gray-700 dark:text-gray-300' },
  { regex: /(?<!dark:)(?<!hover:)(?<!focus:)(?<!active:)\bbg-white\/5\b/g, replacement: 'bg-black/5 dark:bg-white/5' },
  { regex: /(?<!dark:)(?<!hover:)(?<!focus:)(?<!active:)\btext-white\b/g, replacement: 'text-gray-900 dark:text-white' },
];

let changedFiles = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;
  
  replacements.forEach(({regex, replacement}) => {
    content = content.replace(regex, replacement);
  });
  
  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    changedFiles++;
    console.log(`Updated ${file}`);
  }
});

console.log(`Updated ${changedFiles} files.`);
