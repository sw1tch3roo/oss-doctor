import { promises as fsp } from 'node:fs';
import path from 'node:path';
import { exec } from '../utils/exec.mjs';

/**
 * Sync labels to GitHub repository
 * @param {string} cwd
 * @param {string} labelsPath
 * @param {Object} options
 * @param {boolean} [options.prune] - Remove labels not in the file
 * @returns {Promise<void>}
 */
export async function syncLabels(cwd, labelsPath, options = {}) {
    const { prune = false } = options;

    // Read labels file
    const fullPath = path.isAbsolute(labelsPath) ? labelsPath : path.join(cwd, labelsPath);
    const content = await fsp.readFile(fullPath, 'utf8');
    const labels = JSON.parse(content);

    if (!Array.isArray(labels)) {
        throw new Error('Labels file must contain an array of label objects');
    }

    // eslint-disable-next-line no-console
    console.log(`📝 Syncing ${labels.length} labels...`);

    // Get current labels from GitHub
    const currentLabelsJson = await exec(
        'gh',
        ['label', 'list', '--json', 'name,color,description', '--limit', '1000'],
        { cwd, captureOutput: true },
    );

    const currentLabels = JSON.parse(currentLabelsJson.stdout);
    const currentLabelNames = new Set(currentLabels.map((/** @type {any} */ l) => l.name.toLowerCase()));

    // Create or update labels
    for (const label of labels) {
        if (!label.name || !label.color) {
            // eslint-disable-next-line no-console
            console.warn(`⚠️  Skipping invalid label: ${JSON.stringify(label)}`);
            continue;
        }

        const exists = currentLabelNames.has(label.name.toLowerCase());

        try {
            if (exists) {
                // Update existing label
                // eslint-disable-next-line no-await-in-loop
                await exec(
                    'gh',
                    [
                        'label',
                        'edit',
                        label.name,
                        '--color',
                        label.color,
                        ...(label.description ? ['--description', label.description] : []),
                    ],
                    { cwd },
                );
                // eslint-disable-next-line no-console
                console.log(`  ✓ Updated: ${label.name}`);
            } else {
                // Create new label
                // eslint-disable-next-line no-await-in-loop
                await exec(
                    'gh',
                    [
                        'label',
                        'create',
                        label.name,
                        '--color',
                        label.color,
                        ...(label.description ? ['--description', label.description] : []),
                    ],
                    { cwd },
                );
                // eslint-disable-next-line no-console
                console.log(`  ✓ Created: ${label.name}`);
            }
        } catch (err) {
            const message = err && typeof err === 'object' && 'message' in err ? err.message : 'Unknown error';

            // eslint-disable-next-line no-console
            console.error(`  ✗ Failed to sync ${label.name}: ${message}`);
        }
    }

    // Prune labels not in the file
    if (prune) {
        const targetLabelNames = new Set(labels.map((l) => l.name.toLowerCase()));

        for (const current of currentLabels) {
            if (!targetLabelNames.has(current.name.toLowerCase())) {
                try {
                    // eslint-disable-next-line no-await-in-loop
                    await exec('gh', ['label', 'delete', current.name, '--yes'], { cwd });
                    // eslint-disable-next-line no-console
                    console.log(`  ✓ Deleted: ${current.name}`);
                } catch (err) {
                    const message = err && typeof err === 'object' && 'message' in err ? err.message : 'Unknown error';

                    // eslint-disable-next-line no-console
                    console.error(`  ✗ Failed to delete ${current.name}: ${message}`);
                }
            }
        }
    }

    // eslint-disable-next-line no-console
    console.log('✅ Labels synced successfully');
}
