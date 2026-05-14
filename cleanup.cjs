const fs = require('fs');
const path = 'src/App.tsx';
const content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

// Find the trash block starting with the specific AI result UI pattern
const targetLine = '                    Niveau : {result.severity}';
const startIndexInLines = lines.findIndex(l => l.includes('Niveau : {result.severity}'));

if (startIndexInLines !== -1) {
  console.log('Found trash at line', startIndexInLines + 1);
  
  // Find start of the block: {result && (
  let start = startIndexInLines;
  while (start > 0 && !lines[start].includes('{result && (')) {
    start--;
  }
  
  // Find end of the block: the closing ); of the return
  let end = startIndexInLines;
  while (end < lines.length && !lines[end].includes('}')) {
    end++;
  }
  
  // Extra safety: we want to delete until the end of the malformed function
  // Looking for the pattern:
  //    </div>
  //   );
  // }
  while (end < lines.length && !lines[end].trim().startsWith('}')) {
      end++;
  }

  console.log('Deleting from line', start + 1, 'to', end + 1);
  lines.splice(start, end - start + 1);
  fs.writeFileSync(path, lines.join('\n'));
  console.log('Cleanup successful.');
} else {
  console.log('Trash pattern not found.');
}
