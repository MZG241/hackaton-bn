const fs = require('fs');
let content = fs.readFileSync('seed.js', 'utf8');

// Replace all 's patterns inside single-quoted desc: strings with escaped version
// Strategy: replace company desc with double-quoted versions
content = content.replace(
  /\{ name:'([^']+)', desc:'([^}]+)', location:'([^']+)', phone:'([^']+)' \}/g,
  (match) => match // keep as is, we'll do line-by-line below
);

// Line-by-line approach for the company array: single quotes with internal apostrophes
const lines = content.split('\n');
const fixedLines = lines.map(line => {
  // Only process company desc lines
  if (!line.includes("desc:'") && !line.includes('desc:`')) return line;
  
  // Find desc:'...' pattern and check if it has internal apostrophes
  return line.replace(/desc:'((?:[^'\\]|\\.)*)'/g, (match, inner) => {
    // If no apostrophe inside, leave as is
    if (!inner.includes("'")) return match;
    // Replace with backtick
    return 'desc:`' + inner + '`';
  });
});

// Also handle the Rwanda Tourism Board and similar lines with 's
const fixedContent = fixedLines.join('\n')
  .replace(/Kigali's skyline/g, "Kigali's skyline")  // already fine in double quotes
  .replace(/Rwanda's digital/g, "Rwanda's digital")
  .replace(/Rwanda's skyline/g, "Rwanda's skyline")
  .replace(/Rwanda's modern/g, "Rwanda's modern")
  .replace(/Rwanda's travel/g, "Rwanda's travel");

fs.writeFileSync('seed.js', fixedContent, 'utf8');
console.log('Fixed apostrophes in seed.js');

// Verify by trying to parse it
try {
  require('./seed.js');
} catch(e) {
  if (e.message.includes('SyntaxError') || e.code) {
    console.log('Still has issues:', e.message);
  }
}
