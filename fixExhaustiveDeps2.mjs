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

const lintResultsPath = '/home/gustavo-saraiva/Documents/FIREWARE/LABS/kortexone-workspace/Fireware Vision CRM/fireware-vision-core/lint-results-final.txt';
const results = fs.readFileSync(lintResultsPath, 'utf-8');

const files = {};
let currentFile = null;

const lines = results.split('\n');
for (const line of lines) {
    if (line.startsWith('/home/')) {
        currentFile = line.trim();
        if (!files[currentFile]) files[currentFile] = [];
    } else if (currentFile && line.includes('makes the dependencies of useEffect Hook') && line.includes('change on every render')) {
        const match = line.match(/The '([^']+)' function makes the dependencies/);
        if (match) {
            const funcName = match[1];
            files[currentFile].push(funcName);
        }
    }
}

for (const [file, funcs] of Object.entries(files)) {
    if (funcs.length === 0) continue;
    if (!fs.existsSync(file)) continue;
    let content = fs.readFileSync(file, 'utf-8');
    let modified = false;

    if (!content.includes('useCallback')) {
        content = content.replace(/import\s+\{([^}]+)\}\s+from\s+['"]react['"]/, (match, p1) => {
            if (p1.includes('useCallback')) return match;
            return `import {${p1}, useCallback } from 'react'`;
        });
    }

    const uniqueFuncs = [...new Set(funcs)];
    
    for (const func of uniqueFuncs) {
        const regex = new RegExp(`const\\s+${func}\\s*=\\s*(?:async\\s*)?(?:\\([^)]*\\))?\\s*=>\\s*\\{`, 'g');
        const matches = [...content.matchAll(regex)];
        
        for (let i = matches.length - 1; i >= 0; i--) {
            const m = matches[i];
            const openPos = m.index + m[0].length - 1;
            const closePos = findClosingBracket(content, openPos);
            
            if (closePos < content.length) {
                const body = content.substring(m.index, closePos);
                
                let funcDeps = new Set();
                ['accountId', 'contactId', 'leadId', 'opportunityId', 'quoteId', 'contractId', 'id', 'entityId', 'entityType', 'profile?.organization_id', 'profile?.id', 'user?.id', 'session?.user?.id', 'toast'].forEach(d => {
                    const cleanDep = d.split('?')[0];
                    if (body.includes(cleanDep) && content.includes(cleanDep)) {
                        funcDeps.add(d);
                    }
                });

                const replacement = `const ${func} = useCallback(${m[0].substring(m[0].indexOf('=') + 1, m[0].length - 1)}{${content.substring(openPos + 1, closePos - 1)}}, [${Array.from(funcDeps).join(', ')}])`;
                content = content.substring(0, m.index) + replacement + content.substring(closePos);
                modified = true;
            }
        }
    }

    if (modified) {
        fs.writeFileSync(file, content);
        console.log(`Updated ${file}`);
    }
}
