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

walkDir('./src', processFile);
walkDir('./supabase/functions', processFile);

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let original = content;
  content = content.replace(/: any/g, ': unknown');
  content = content.replace(/<any>/g, '<unknown>');
  content = content.replace(/as any/g, 'as unknown');
  if (content !== original) {
    fs.writeFileSync(filePath, content);
  }
}
