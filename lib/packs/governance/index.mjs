/**
 * Governance pack - generates CODEOWNERS
 * ONLY if governance.enabled === true in config
 */

export const pack = 'governance';

/**
 * Get files for governance pack based on config
 * @param {import('../../core/config.mjs').OssDoctorConfig} config
 * @returns {string[]}
 */
export function getFiles(config) {
    if (!config.governance.enabled) {
        return [];
    }

    const { codeowners } = config.governance;

    if (!codeowners) {
        return [];
    }

    if (codeowners.mode === 'none') {
        return [];
    }

    if (codeowners.mode === 'explicit' && (!codeowners.owners || codeowners.owners.length === 0)) {
        return [];
    }

    return ['CODEOWNERS'];
}
