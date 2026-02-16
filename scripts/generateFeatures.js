import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const businessDir = path.resolve(__dirname, '../packages/cli/src/business');
const targetFile = path.resolve(__dirname, '../packages/cli/src/utils/_internal/features.json');

const excludes = [
    'docs',
    '__tests__',
    'shared',
    'utils',
    'common',
    'core',
    'types',
    'common',
    'core',
    'implementations',
];
const renameCommands = [['translate', 'eng']];

function getFeatures() {
    const features = [];
    if (!fs.existsSync(businessDir)) {
        console.error(`Directory not found: ${businessDir}`);
        process.exit(1);
    }

    // Get Level 1 directories (e.g., ai, color, git)
    const l1Dirs = fs.readdirSync(businessDir).filter((f) => {
        // Only include directories
        return fs.statSync(path.join(businessDir, f)).isDirectory();
    });

    l1Dirs.forEach((l1) => {
        const l1Path = path.join(businessDir, l1);

        // Get Level 2 directories, applying the exclude list
        const l2Dirs = fs.readdirSync(l1Path).filter((f) => {
            const isDir = fs.statSync(path.join(l1Path, f)).isDirectory();
            return isDir && !excludes.includes(f);
        });

        if (l2Dirs.length === 0) {
            // If no valid subdirectories, add the parent itself
            features.push(l1);
        } else {
            // If valid subdirectories exist, add parent + child pairs
            l2Dirs.forEach((l2) => {
                features.push(`${l1} ${l2}`);
            });
        }
    });

    return features.map((feature) => {
        const match = renameCommands.find((entities) => entities[0] === feature);
        if (!match) {
            return feature;
        }
        return match[1];
    });
}

try {
    const features = getFeatures();
    // Sort features for consistent output
    features.sort();

    fs.writeFileSync(targetFile, JSON.stringify(features, null, 4));
    console.log(`Successfully generated ${features.length} features to ${targetFile}`);
} catch (err) {
    console.error('Error generating features:', err);
    process.exit(1);
}
