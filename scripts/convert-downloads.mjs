import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const DOWNLOADS_DIR = '/home/hiroki/Downloads';

async function convertPngToWebp() {
    try {
        const files = fs.readdirSync(DOWNLOADS_DIR);
        const pngFiles = files.filter(file => file.toLowerCase().endsWith('.png'));

        if (pngFiles.length === 0) {
            console.log('No PNG files found in Downloads.');
            return;
        }

        console.log(`Found ${pngFiles.length} PNG files. Starting conversion...`);

        for (const file of pngFiles) {
            const pngPath = path.join(DOWNLOADS_DIR, file);
            const webpPath = path.join(DOWNLOADS_DIR, file.replace(/\.png$/i, '.webp'));

            await sharp(pngPath)
                .webp({ quality: 80 })
                .toFile(webpPath);

            console.log(`Converted: ${file} -> ${path.basename(webpPath)}`);

            // Delete the original PNG file
            fs.unlinkSync(pngPath);
            console.log(`Deleted original: ${file}`);
        }

        console.log('All conversions completed successfully.');
    } catch (error) {
        console.error('Error during conversion:', error);
        process.exit(1);
    }
}

convertPngToWebp();
