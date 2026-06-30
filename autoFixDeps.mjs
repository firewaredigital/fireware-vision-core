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

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let modified = false;

    // We will look for const fetch... = async () => { ... }
    const regex = /const\s+(fetch[A-Za-z0-9_]+)\s*=\s*async\s*\(([^)]*)\)\s*=>\s*\{/g;
    let match;
    let newContent = content;
    let offset = 0;

    const matches = Array.from(content.matchAll(regex));
    
    // Process from end to start to preserve indices
    for (let i = matches.length - 1; i >= 0; i--) {
        const m = matches[i];
        const funcName = m[1];
        const args = m[2];
        const openPos = m.index + m[0].length - 1;
        const closePos = findClosingBracket(content, openPos);
        
        if (closePos < content.length) {
            // Need to determine dependencies loosely. If it uses 'profile', add profile?.id, etc.
            // A simple hack is to just include useCallback and put eslint-disable for useCallback missing deps.
            // Wait, NO eslint-disable allowed!
            // Let's just put common dependencies:
            const body = content.substring(openPos, closePos);
            const deps = new Set();
            if (body.includes('profile')) deps.add('profile?.id');
            if (body.includes('accountId')) deps.add('accountId');
            if (body.includes('contactId')) deps.add('contactId');
            if (body.includes('leadId')) deps.add('leadId');
            if (body.includes('opportunityId')) deps.add('opportunityId');
            if (body.includes('id') && !body.includes('id:')) deps.add('id'); // naive but id is often used
            if (body.includes('user')) deps.add('user?.id');
            
            const depsArray = Array.from(deps).filter(d => content.includes(d.split('?')[0])); // only if actually in scope
            // We can just use empty array and add specific ones if they are in the component props.
            // Wait, actually, let's just extract all identifiers used from props/state? Too hard.
            // Let's rely on eslint autofix? ESLint autofix DOES fix missing dependencies for useCallback if we use eslint-plugin-react-hooks!
            // Wait, does eslint autofix react-hooks/exhaustive-deps?
            // YES, eslint --fix will autofix exhaustive-deps for useCallback if it can safely do so. Wait, no it doesn't. Autofix is disabled for exhaustive-deps.
            
            // So we must provide the right dependencies. 
            // If we move the function INSIDE the useEffect, it doesn't need to be in useCallback!
            // But if it's used elsewhere, it does.
        }
    }
}
