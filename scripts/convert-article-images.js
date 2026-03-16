import sharp from 'sharp';
import path from 'path';

const files = [
    {
        src: '/home/hiroki/.gemini/antigravity/brain/7269510a-2c4a-4754-8c18-75476f15e237/media__1773587312205.jpg',
        dest: '/home/hiroki/Desktop/touhan-project/public/assets/images/articles/merit-hero.webp'
    },
    {
        src: '/home/hiroki/.gemini/antigravity/brain/7269510a-2c4a-4754-8c18-75476f15e237/media__1773587315744.jpg',
        dest: '/home/hiroki/Desktop/touhan-project/public/assets/images/articles/reasons-1-3.webp'
    },
    {
        src: '/home/hiroki/.gemini/antigravity/brain/7269510a-2c4a-4754-8c18-75476f15e237/media__1773587319108.jpg',
        dest: '/home/hiroki/Desktop/touhan-project/public/assets/images/articles/reasons-4-6.webp'
    }
];

async function convert() {
    for (const file of files) {
        console.log(`Converting ${file.src} to ${file.dest}...`);
        try {
            await sharp(file.src).webp().toFile(file.dest);
            console.log('Done.');
        } catch (err) {
            console.error(`Error converting ${file.src}:`, err);
        }
    }
}

convert();
