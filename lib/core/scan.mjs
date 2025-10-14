// @ts-check
import { exists } from '../utils/fs.mjs';

const REQUIRED = {
    community: ['CODE_OF_CONDUCT.md', 'CONTRIBUTING.md', 'SECURITY.md'],
    github: [
        '.github/ISSUE_TEMPLATE/bug_report.yml',
        '.github/ISSUE_TEMPLATE/feature_request.yml',
        '.github/PULL_REQUEST_TEMPLATE.md',
        '.github/FUNDING.yml',
    ],
    code: ['.editorconfig', '.gitattributes'],
};

/**
 * @param {string} cwd
 */
export async function scanRepo(cwd) {
    /** @type {{community: string[], github: string[], code: string[], ci: string[]}} */
    const missing = { community: [], github: [], code: [], ci: [] };
    /** @type {string[]} */
    const existing = [];

    // Collect all check promises
    const allChecks = [];

    for (const [pack, files] of Object.entries(REQUIRED)) {
        for (const rel of files) {
            allChecks.push({ pack, rel, checkPromise: exists(cwd, rel) });
        }
    }

    // Execute all checks in parallel
    const results = await Promise.all(allChecks.map((item) => item.checkPromise));

    // Process results
    for (let i = 0; i < allChecks.length; i++) {
        const { pack, rel } = allChecks[i];
        const has = results[i];

        if (!has) {
            missing[/** @type {keyof typeof missing} */ (pack)].push(rel);
        } else {
            existing.push(rel);
        }
    }

    const hasCI = (await exists(cwd, '.github/workflows/ci.yml')) || (await exists(cwd, '.github/workflows/test.yml'));

    if (!hasCI) {
        missing.ci.push('.github/workflows/ci.yml');
    }

    return { missing, existing, hasCI };
}
