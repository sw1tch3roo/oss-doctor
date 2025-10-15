import { promises as fsp } from 'node:fs';
import path from 'node:path';

/**
 * Docs pack - checks README health (read-only)
 * Does NOT auto-generate files
 */

export const pack = 'docs';

/**
 * Get files for docs pack (returns empty, this is read-only)
 * @param {import('../../core/config.mjs').OssDoctorConfig} config
 * @returns {string[]}
 */
export function getFiles(config) {
    // Docs pack doesn't generate files, only checks
    return [];
}

/**
 * Check README health
 * @param {string} cwd
 * @returns {Promise<{missing: string[], suggestions: string[]}>}
 */
export async function checkReadmeHealth(cwd) {
    const readmePath = path.join(cwd, 'README.md');
    /** @type {string[]} */
    const missing = [];
    /** @type {string[]} */
    const suggestions = [];

    try {
        const content = await fsp.readFile(readmePath, 'utf8');
        const lower = content.toLowerCase();

        // Check for essential sections
        const sections = {
            description: /^#+\s*(description|about|overview)/im,
            install: /^#+\s*(install|installation|getting started|setup)/im,
            usage: /^#+\s*(usage|how to use|examples?)/im,
            contributing: /^#+\s*contribut(ing|ion)/im,
            license: /^#+\s*licen[cs]e/im,
        };

        for (const [name, pattern] of Object.entries(sections)) {
            if (!pattern.test(content)) {
                missing.push(name);
            }
        }

        // Check if readme-shields-sync is present
        try {
            const pkgPath = path.join(cwd, 'package.json');
            const pkgContent = await fsp.readFile(pkgPath, 'utf8');
            const pkg = JSON.parse(pkgContent);

            if (pkg.devDependencies && pkg.devDependencies['readme-shields-sync']) {
                suggestions.push('Consider running readme-shields-sync to update badges');
            }
        } catch {
            // Ignore
        }
    } catch (err) {
        if (err && typeof err === 'object' && 'code' in err && err.code === 'ENOENT') {
            missing.push('README.md file itself');
        }
    }

    return { missing, suggestions };
}
