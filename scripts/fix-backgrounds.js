const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else if (file.endsWith('.jsx')) { 
      results.push(file);
    }
  });
  return results;
}

const files = walk('./src');
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  // Skip if already has bg-white dark:bg-[#0A0A0A]
  if (content.includes('bg-[#0A0A0A]')) {
    // Replace all bg-[#0A0A0A] with bg-white dark:bg-[#0A0A0A], but only if it's not already dark:bg-[#0A0A0A]
    // Using a negative lookbehind if supported, otherwise just a simple replace
    const newContent = content.replace(/(?<!dark:)bg-\[#0A0A0A\]/g, 'bg-white dark:bg-[#0A0A0A]');
    if (newContent !== content) {
      fs.writeFileSync(file, newContent);
      console.log('Fixed', file);
    }
  }
});
