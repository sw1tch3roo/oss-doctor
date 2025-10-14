// @ts-check
import { writeTemplateIfMissing, ensureDir } from '../utils/fs.mjs';

/**
 * @param {string} cwd
 * @param {any} report
 */
export async function applyFixes(cwd, report) {
    /** @type {string[]} */
    const changes = [];

    await writeTemplateIfMissing(cwd, 'CODE_OF_CONDUCT.md', 'packs/community/templates/CODE_OF_CONDUCT.md', changes);
    await writeTemplateIfMissing(cwd, 'CONTRIBUTING.md', 'packs/community/templates/CONTRIBUTING.md', changes);
    await writeTemplateIfMissing(cwd, 'SECURITY.md', 'packs/community/templates/SECURITY.md', changes);

    await ensureDir(cwd, '.github/ISSUE_TEMPLATE');
    await writeTemplateIfMissing(
        cwd,
        '.github/ISSUE_TEMPLATE/bug_report.yml',
        'packs/github/templates/ISSUE_TEMPLATE/bug_report.yml',
        changes,
    );
    await writeTemplateIfMissing(
        cwd,
        '.github/ISSUE_TEMPLATE/feature_request.yml',
        'packs/github/templates/ISSUE_TEMPLATE/feature_request.yml',
        changes,
    );
    await writeTemplateIfMissing(
        cwd,
        '.github/PULL_REQUEST_TEMPLATE.md',
        'packs/github/templates/PULL_REQUEST_TEMPLATE.md',
        changes,
    );
    await writeTemplateIfMissing(cwd, '.github/FUNDING.yml', 'packs/github/templates/FUNDING.yml', changes);

    await writeTemplateIfMissing(cwd, '.editorconfig', 'packs/code/templates/editorconfig', changes);
    await writeTemplateIfMissing(cwd, '.gitattributes', 'packs/code/templates/gitattributes', changes);

    await ensureDir(cwd, '.github/workflows');
    await writeTemplateIfMissing(cwd, '.github/workflows/ci.yml', 'packs/ci/templates/ci.yml', changes);

    const branchName = `oss-doctor/fix-${Date.now()}`;

    return {
        branchName,
        summary: `💉 Applied ${changes.length} changes:\n` + changes.map((c) => `  - ${c}`).join('\n'),
    };
}
