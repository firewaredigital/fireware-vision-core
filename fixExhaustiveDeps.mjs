import fs from 'fs';
import path from 'path';

function findClosingBracket(text, openPos) {
    let count = 1;
    let i = openPos + 1;
    while (i < text.length && count > 0) {
        if (text[i] === '{') count++;
        else if (text[i] === '}') count--;
        i++;
    }
    return i;
}

const lintResultsPath = '/home/gustavo-saraiva/Documents/FIREWARE/LABS/kortexone-workspace/Fireware Vision CRM/fireware-vision-core/lint-results.txt';
const results = fs.readFileSync(lintResultsPath, 'utf-8');

// Parse lint-results.txt to get files and their missing dependencies for useEffect
// e.g. /home/.../src/pages/ActivitiesPage.tsx
//  142:6  warning  React Hook useEffect has a missing dependency: 'fetchActivities'
const files = {};
let currentFile = null;

const lines = results.split('\n');
for (const line of lines) {
    if (line.startsWith('/home/')) {
        currentFile = line.trim();
        if (!files[currentFile]) files[currentFile] = [];
    } else if (currentFile && line.includes('warning  React Hook useEffect has') && line.includes('missing dependenc')) {
        // extract the dependency name, e.g. 'fetchActivities' or 'fetchApprovers', 'fetchPendingApprovals'
        const match = line.match(/missing dependenc(?:y|ies):\s+((?:'[^']+'(?:,\s*'[^']+')*(?:,\s*and\s*'[^']+')?))/);
        if (match) {
            // Extract all single-quoted strings
            const depsStr = match[1];
            const deps = [...depsStr.matchAll(/'([^']+)'/g)].map(m => m[1]);
            // find the line number
            const lineMatch = line.match(/^\s*(\d+):/);
            if (lineMatch) {
                files[currentFile].push({ line: parseInt(lineMatch[1]), deps });
            }
        }
    }
}

console.log(`Found ${Object.keys(files).length} files to process.`);

// Now process each file
for (const [file, issues] of Object.entries(files)) {
    if (!fs.existsSync(file)) {
        console.log(`File not found: ${file}`);
        continue;
    }
    let content = fs.readFileSync(file, 'utf-8');
    let modified = false;

    // First ensure useCallback is imported if we are going to use it
    if (issues.some(issue => issue.deps.some(d => d.startsWith('fetch')))) {
        if (!content.includes('useCallback')) {
            content = content.replace(/import\s+\{([^}]+)\}\s+from\s+['"]react['"]/, (match, p1) => {
                if (p1.includes('useCallback')) return match;
                return `import {${p1}, useCallback } from 'react'`;
            });
        }
    }

    // Process from bottom to top to preserve line numbers/indices
    // But since one file might have multiple issues, we'll just do a global replace for the function definitions
    const depsToWrap = new Set();
    for (const issue of issues) {
        for (const dep of issue.deps) {
            if (dep.startsWith('fetch') || dep.startsWith('check')) { // naive check for functions we want to wrap
                depsToWrap.add(dep);
            }
        }
    }

    for (const dep of depsToWrap) {
        // Find const fetchSomething = async () => {
        // or const fetchSomething = async (args) => {
        const regex = new RegExp(`const\\s+${dep}\\s*=\\s*async\\s*\\(([^)]*)\\)\\s*=>\\s*\\{`, 'g');
        const matches = [...content.matchAll(regex)];
        
        // Reverse iterate
        for (let i = matches.length - 1; i >= 0; i--) {
            const m = matches[i];
            const openPos = m.index + m[0].length - 1;
            const closePos = findClosingBracket(content, openPos);
            
            if (closePos < content.length) {
                const body = content.substring(m.index, closePos);
                
                // Determine dependencies by looking at useEffect that uses this function
                // Wait, it's safer to just extract common dependencies from the component's scope
                // by finding what variables are used inside the function that might change
                let funcDeps = new Set();
                ['accountId', 'contactId', 'leadId', 'opportunityId', 'quoteId', 'contractId', 'id', 'entityId', 'entityType', 'profile?.id', 'user?.id'].forEach(d => {
                    if (body.includes(d.split('?')[0]) && content.includes(d.split('?')[0])) {
                        funcDeps.add(d);
                    }
                });

                // Wrap in useCallback
                const replacement = `const ${dep} = useCallback(async (${m[1]}) => {${content.substring(openPos + 1, closePos - 1)}}, [${Array.from(funcDeps).join(', ')}])`;
                content = content.substring(0, m.index) + replacement + content.substring(closePos);
                modified = true;
            }
        }
    }

    // Now update the useEffect arrays
    for (let i = issues.length - 1; i >= 0; i--) {
        const issue = issues[i];
        const linesArr = content.split('\n');
        // line is 1-indexed. The warning points to the `useEffect` call or its closing brace.
        // Usually, the missing deps warning is on the closing brace: `  }, [deps]);`
        const lineIdx = issue.line - 1;
        
        if (linesArr[lineIdx]) {
            // Find the array [ ... ] and inject the missing deps
            const match = linesArr[lineIdx].match(/\[(.*?)\]/);
            if (match) {
                const existing = match[1].trim();
                const toAdd = issue.deps.filter(d => !existing.includes(d));
                if (toAdd.length > 0) {
                    const newDeps = existing ? `${existing}, ${toAdd.join(', ')}` : toAdd.join(', ');
                    linesArr[lineIdx] = linesArr[lineIdx].replace(`[${existing}]`, `[${newDeps}]`);
                    content = linesArr.join('\n');
                    modified = true;
                }
            } else if (linesArr[lineIdx].includes('}')) {
                // sometimes it's missing the array entirely
                // }, []);
                // Wait, if it has no array, we should add one? The warning says "missing dependency", which implies there IS an array.
                // If it was missing entirely, we'd add it.
            }
        }
    }

    if (modified) {
        fs.writeFileSync(file, content);
        console.log(`Updated ${file}`);
    }
}
