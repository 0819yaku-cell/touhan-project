import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const SOURCE_DIR = path.join(process.cwd(), 'public', 'assets', 'images', 'diagrams');
const BACKUP_DIR = path.join(SOURCE_DIR, 'backup_raw');

// Ensure directories exist
if (!fs.existsSync(SOURCE_DIR)) {
    fs.mkdirSync(SOURCE_DIR, { recursive: true });
}
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

async function optimizeImages() {
    const files = fs.readdirSync(SOURCE_DIR);
    let processedCount = 0;

    for (const file of files) {
        const filePath = path.join(SOURCE_DIR, file);

        // Skip directories like backup_raw
        if (fs.statSync(filePath).isDirectory()) continue;

        const ext = path.extname(file).toLowerCase();

        // Process PNG and JPG files
        if (ext === '.png' || ext === '.jpg' || ext === '.jpeg') {
            const baseName = path.basename(file, path.extname(file));
            const targetPath = path.join(SOURCE_DIR, `${baseName}.webp`);
            const backupPath = path.join(BACKUP_DIR, file);

            console.log(`Optimizing: ${file} -> ${baseName}.webp (Quality: 85)`);

            try {
                await sharp(filePath)
                    .webp({ quality: 85 })
                    .toFile(targetPath);

                // Move original file to backup directory
                fs.renameSync(filePath, backupPath);
                processedCount++;
                console.log(`  ✓ Successfully converted and moved the original to backup_raw/${file}`);
            } catch (err) {
                console.error(`  ✗ Error processing ${file}:`, err);
            }
        }
    }

    if (processedCount === 0) {
        console.log('No images required optimization.');
    } else {
        console.log(`\nSuccessfully optimized ${processedCount} images!`);
    }
}

optimizeImages().catch(err => {
    console.error('Optimization failed:', err);
    process.exit(1);
});
