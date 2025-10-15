import { exists } from '../utils/fs.mjs';
import { checkReadmeHealth } from '../packs/docs/index.mjs';

/**
 * Pack file definitions
 */
const PACK_FILES = {
    community: ['CODE_OF_CONDUCT.md', 'CONTRIBUTING.md', 'SECURITY.md'],
    hygiene: ['.editorconfig', '.gitattributes'],
    project: [
        '.github/ISSUE_TEMPLATE/bug_report.yml',
        '.github/ISSUE_TEMPLATE/feature_request.yml',
        '.github/ISSUE_TEMPLATE/question.yml',
        '.github/PULL_REQUEST_TEMPLATE.md',
    ],
    workflows: ['.github/workflows/ci.yml'],
    // funding and governance are handled by their pack modules
    // docs doesn't generate files
};

/**
 * Get files for a pack based on config
 * @param {string} pack
 * @param {import('./config.mjs').OssDoctorConfig} config
 * @returns {string[]}
 */
function getFilesForPack(pack, config) {
    // Static packs
    /** @type {Record<string, string[]>} */
    const packFiles = PACK_FILES;

    if (packFiles[pack]) {
        return packFiles[pack];
    }

    // Dynamic packs based on config
    if (pack === 'funding') {
        if (!config.funding.enabled) {
            return [];
        }

        const { providers } = config.funding;

        if (!providers) {
            return [];
        }

        const hasProvider =
            (providers.github && providers.github.length > 0) || providers.open_collective || providers.ko_fi;

        return hasProvider ? ['.github/FUNDING.yml'] : [];
    }

    if (pack === 'governance') {
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

    if (pack === 'workflows') {
        const files = ['.github/workflows/ci.yml'];

        // Add changesets workflows if enabled
        if (config.workflows.changesetsFlow) {
            files.push('.github/workflows/prepare-release.yml');
            files.push('.github/workflows/release.yml');
        }

        // Add label sync if labels path configured
        if (config.project.labels) {
            files.push('.github/workflows/label-sync.yml');
        }

        // Add stale workflow if enabled
        if (config.project.stale?.enabled) {
            files.push('.github/workflows/stale.yml');
        }

        // Add triage workflow if enabled
        if (config.project.triage?.enabled) {
            files.push('.github/workflows/triage.yml');
        }

        return files;
    }

    return [];
}

/**
 * Scan repository for missing OSS files
 * @param {string} cwd
 * @param {import('./config.mjs').OssDoctorConfig} config
 * @returns {Promise<{missing: Record<string, string[]>, existing: string[], readmeHealth?: any}>}
 */
export async function scanRepo(cwd, config) {
    /** @type {Record<string, string[]>} */
    const missing = {};
    /** @type {string[]} */
    const existing = [];

    // Only scan packs that are enabled
    for (const pack of config.packs) {
        const files = getFilesForPack(pack, config);

        missing[pack] = [];

        for (const filePath of files) {
            // eslint-disable-next-line no-await-in-loop
            const fileExists = await exists(cwd, filePath);

            if (!fileExists) {
                missing[pack].push(filePath);
            } else {
                existing.push(filePath);
            }
        }
    }

    // Check README health if docs pack is enabled
    let readmeHealth;

    if (config.packs.includes('docs') && config.docs.readmeHealth) {
        readmeHealth = await checkReadmeHealth(cwd);
    }

    return { missing, existing, readmeHealth };
}
