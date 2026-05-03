const fs = require('fs');
const path = require('path');

const srcDir = "/Users/rudra/.gemini/antigravity/brain/6e5d2687-705b-4c77-9e94-058bb56098e7/.tempmediaStorage";
const destDir = "/Users/rudra/Downloads/create-anything/apps/mobile/assets/images";

const imagesToCopy = [
    { src: 'media_6e5d2687-705b-4c77-9e94-058bb56098e7_1775510141695.png', dest: 'lumi-acc-new.png' },
    { src: 'media_6e5d2687-705b-4c77-9e94-058bb56098e7_1775510178385.png', dest: 'onboarding-1.png' },
    { src: 'media_6e5d2687-705b-4c77-9e94-058bb56098e7_1775510185156.png', dest: 'onboarding-2.png' },
    { src: 'media_6e5d2687-705b-4c77-9e94-058bb56098e7_1775510194561.png', dest: 'onboarding-3.png' },
    { src: 'media_6e5d2687-705b-4c77-9e94-058bb56098e7_1775510206317.png', dest: 'onboarding-4.png' }
];

imagesToCopy.forEach(img => {
    const srcPath = path.join(srcDir, img.src);
    const destPath = path.join(destDir, img.dest);
    if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, destPath);
        console.log(`Copied ${img.src} to ${img.dest}`);
    } else {
        console.log(`File not found: ${img.src}`);
    }
});
