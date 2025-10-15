import { exists } from '../utils/fs.mjs';

/**
 * @typedef {Object} PlanAction
 * @property {string} path - File path
 * @property {'add'|'skip'|'update'} action - Action to take
 * @property {string} reason - Why this action
 * @property {string} pack - Which pack owns this file
 */

/**
 * Build a plan for applying fixes based on scan results
 * @param {string} cwd
 * @param {any} scanResult
 * @param {import('./config.mjs').OssDoctorConfig} config
 * @param {Object} options
 * @param {boolean} [options.force] - Force overwrite existing files
 * @returns {Promise<PlanAction[]>}
 */
export async function buildPlan(cwd, scanResult, config, options = {}) {
    const { force = false } = options;
    /** @type {PlanAction[]} */
    const plan = [];

    // Process each pack's missing files
    for (const [pack, files] of Object.entries(scanResult.missing)) {
        if (!Array.isArray(files)) {
            continue;
        }

        for (const filePath of files) {
            // eslint-disable-next-line no-await-in-loop
            const fileExists = await exists(cwd, filePath);

            if (fileExists && !force) {
                plan.push({
                    path: filePath,
                    action: 'skip',
                    reason: 'File exists (use --force to overwrite)',
                    pack,
                });
            } else if (fileExists && force) {
                plan.push({
                    path: filePath,
                    action: 'update',
                    reason: 'Overwriting with --force',
                    pack,
                });
            } else {
                plan.push({
                    path: filePath,
                    action: 'add',
                    reason: 'File missing',
                    pack,
                });
            }
        }
    }

    // Sort plan by pack then path for deterministic output
    plan.sort((a, b) => {
        if (a.pack !== b.pack) {
            return a.pack.localeCompare(b.pack);
        }

        return a.path.localeCompare(b.path);
    });

    return plan;
}

/**
 * Format plan as human-readable table
 * @param {PlanAction[]} plan
 * @returns {string}
 */
export function formatPlanTable(plan) {
    if (plan.length === 0) {
        return '✅ No changes needed';
    }

    const lines = ['📋 Plan:', ''];

    // Group by pack
    /** @type {Record<string, PlanAction[]>} */
    const byPack = {};

    for (const action of plan) {
        if (!byPack[action.pack]) {
            byPack[action.pack] = [];
        }

        byPack[action.pack].push(action);
    }

    for (const [pack, actions] of Object.entries(byPack)) {
        lines.push(`  ${pack}:`);

        for (const action of actions) {
            let icon = '⊘';

            if (action.action === 'add') {
                icon = '➕';
            } else if (action.action === 'update') {
                icon = '🔄';
            }

            lines.push(`    ${icon} ${action.action.padEnd(6)} ${action.path.padEnd(50)} (${action.reason})`);
        }

        lines.push('');
    }

    return lines.join('\n');
}

/**
 * Format plan as JSON
 * @param {PlanAction[]} plan
 * @returns {string}
 */
export function formatPlanJson(plan) {
    return JSON.stringify({ plan }, null, 2);
}
