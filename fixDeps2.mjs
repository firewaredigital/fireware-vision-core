import fs from 'fs';

const lintResultsPath = process.argv[2];
if (!lintResultsPath) {
  console.error("Please provide lint results file path");
  process.exit(1);
}
const results = fs.readFileSync(lintResultsPath, 'utf-8');

const files = {};
let currentFile = null;

for (const line of results.split('\n')) {
    if (line.startsWith('/home/')) {
        currentFile = line.trim();
        if (!files[currentFile]) files[currentFile] = [];
    } else if (currentFile && line.includes('warning  React Hook')) {
        const lineMatch = line.match(/^\s*(\d+):/);
        if (!lineMatch) continue;
        const lineNum = parseInt(lineMatch[1]);
        
        let addDeps = [];
        let removeDeps = [];
        
        if (line.includes('missing dependenc')) {
            const match = line.match(/missing dependenc(?:y|ies):\s+((?:'[^']+'(?:,\s*'[^']+')*(?:,\s*and\s*'[^']+')?))/);
            if (match) {
                addDeps = [...match[1].matchAll(/'([^']+)'/g)].map(m => m[1]);
            }
        } else if (line.includes('unnecessary dependenc')) {
            const match = line.match(/unnecessary dependenc(?:y|ies):\s+((?:'[^']+'(?:,\s*'[^']+')*(?:,\s*and\s*'[^']+')?))/);
            if (match) {
                removeDeps = [...match[1].matchAll(/'([^']+)'/g)].map(m => m[1]);
            }
        } else if (line.includes('complex expression')) {
            // handle complex expression? we handle manually
        }
        
        if (addDeps.length > 0 || removeDeps.length > 0) {
            files[currentFile].push({ line: lineNum, addDeps, removeDeps });
        }
    }
}

console.log(`Found ${Object.keys(files).length} files to fix.`);

for (const [file, issues] of Object.entries(files)) {
    if (!fs.existsSync(file)) continue;
    let content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    let modified = false;

    // Process from bottom to top so line numbers stay valid
    // Wait, multiple issues on the same line? Unlikely, but possible.
    // If so, group by line
    const issuesByLine = {};
    for (const issue of issues) {
        if (!issuesByLine[issue.line]) issuesByLine[issue.line] = { add: new Set(), remove: new Set() };
        issue.addDeps.forEach(d => issuesByLine[issue.line].add.add(d));
        issue.removeDeps.forEach(d => issuesByLine[issue.line].remove.add(d));
    }

    for (const lineStr of Object.keys(issuesByLine).sort((a, b) => b - a)) {
        const lineNum = parseInt(lineStr);
        const issue = issuesByLine[lineNum];
        const idx = lineNum - 1;
        
        let targetLine = lines[idx];
        if (targetLine && targetLine.includes('[')) {
            const match = targetLine.match(/\[(.*?)\]/);
            if (match) {
                let currentDeps = match[1].split(',').map(s => s.trim()).filter(s => s.length > 0);
                let newDeps = new Set(currentDeps);
                
                issue.add.forEach(d => {
                    if (d === 'profile.id' && !newDeps.has('profile?.id')) newDeps.add('profile?.id');
                    else if (d === 'user.id' && !newDeps.has('user?.id')) newDeps.add('user?.id');
                    else newDeps.add(d);
                });
                issue.remove.forEach(d => {
                    newDeps.delete(d);
                    if (d === 'profile.id') newDeps.delete('profile?.id');
                    if (d === 'user.id') newDeps.delete('user?.id');
                });
                
                const replacement = `[${Array.from(newDeps).join(', ')}]`;
                lines[idx] = targetLine.replace(/\[.*?\]/, replacement);
                modified = true;
            }
        }
    }

    if (modified) {
        fs.writeFileSync(file, lines.join('\n'));
        console.log(`Updated ${file}`);
    }
}
