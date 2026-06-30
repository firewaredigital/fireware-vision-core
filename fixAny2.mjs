import fs from 'fs';
import path from 'path';

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else if (f.endsWith('.ts') || f.endsWith('.tsx')) {
      callback(dirPath);
    }
  });
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let original = content;
  content = content.replace(/<string,\s*any>/g, '<string, unknown>');
  content = content.replace(/any\[\]/g, 'unknown[]');
  content = content.replace(/\(any\)/g, '(unknown)');
  content = content.replace(/:\s*any/g, ': unknown');
  content = content.replace(/any\s*=>/g, 'unknown =>');
  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${filePath}`);
  }
}

walkDir('./src', processFile);
walkDir('./supabase/functions', processFile);
