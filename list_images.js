const fs = require('fs');
const path = require('path');

const srcDir = "/Users/rudra/.gemini/antigravity/brain/6e5d2687-705b-4c77-9e94-058bb56098e7/.tempmediaStorage";

const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.png'));
files.sort((a, b) => {
    return fs.statSync(path.join(srcDir, b)).mtime.getTime() - fs.statSync(path.join(srcDir, a)).mtime.getTime();
});

files.slice(0, 10).forEach((f, i) => {
    console.log(`${i}: ${f} - ${fs.statSync(path.join(srcDir, f)).mtime}`);
});
