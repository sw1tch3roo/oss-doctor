import { promises as fsp } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ensureDir, exists } from '../utils/fs.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Get template path for a file
 * @param {string} filePath
 * @returns {string}
 */
function getTemplatePath(filePath) {
    const projectRoot = path.resolve(__dirname, '..', '..');

    // Map file paths to templates
    if (filePath.startsWith('.github/ISSUE_TEMPLATE/')) {
        const filename = path.basename(filePath);

        return path.join(projectRoot, 'lib/packs/project/templates/ISSUE_TEMPLATE', filename);
    }

    if (filePath.startsWith('.github/workflows/')) {
        const filename = path.basename(filePath);

        return path.join(projectRoot, 'lib/packs/workflows/templates', filename);
    }

    if (filePath === '.github/PULL_REQUEST_TEMPLATE.md') {
        return path.join(projectRoot, 'lib/packs/project/templates/PULL_REQUEST_TEMPLATE.md');
    }

    if (filePath === '.github/FUNDING.yml') {
        return path.join(projectRoot, 'lib/packs/funding/templates/FUNDING.yml');
    }

    if (filePath === 'CODEOWNERS') {
        return path.join(projectRoot, 'lib/packs/governance/templates/CODEOWNERS');
    }

    if (filePath === 'CODE_OF_CONDUCT.md') {
        return path.join(projectRoot, 'lib/packs/community/templates/CODE_OF_CONDUCT.md');
    }

    if (filePath === 'CONTRIBUTING.md') {
        return path.join(projectRoot, 'lib/packs/community/templates/CONTRIBUTING.md');
    }

    if (filePath === 'SECURITY.md') {
        return path.join(projectRoot, 'lib/packs/community/templates/SECURITY.md');
    }

    if (filePath === '.editorconfig') {
        return path.join(projectRoot, 'lib/packs/hygiene/templates/editorconfig');
    }

    if (filePath === '.gitattributes') {
        return path.join(projectRoot, 'lib/packs/hygiene/templates/gitattributes');
    }

    throw new Error(`No template found for ${filePath}`);
}

/**
 * Apply template substitutions
 * @param {string} content
 * @param {import('./config.mjs').OssDoctorConfig} config
 * @returns {string}
 */
function applySubstitutions(content, config) {
    let result = content;

    // Security email
    const securityEmail = config.contacts?.securityEmail || 'security@example.com';

    result = result.replace(/{{SECURITY_EMAIL}}/g, securityEmail);

    // Security content for SECURITY.md
    const securityContent = config.contacts?.securityEmail
        ? `Report vulnerabilities: ${config.contacts.securityEmail}\nWe aim to acknowledge within 48 hours and fix as soon as possible.`
        : 'Please report security vulnerabilities by opening a private security advisory on GitHub or by emailing the maintainers.';

    result = result.replace(/{{SECURITY_CONTENT}}/g, securityContent);

    // Node version for workflows
    result = result.replace(/{{NODE_VERSION}}/g, String(config.workflows.ciNode || 20));

    // Labels path for label-sync workflow
    result = result.replace(/{{LABELS_PATH}}/g, config.project.labels || './labels.json');

    // Stale days
    result = result.replace(/{{STALE_DAYS}}/g, String(config.project.stale?.days || 60));

    // Except labels for stale
    const exceptLabels = config.project.stale?.exceptLabels?.join(',') || 'pinned,security';

    result = result.replace(/{{EXCEPT_LABELS}}/g, exceptLabels);

    // FUNDING.yml content
    if (content.includes('{{FUNDING_CONTENT}}')) {
        const fundingLines = [];

        if (config.funding.providers?.github && config.funding.providers.github.length > 0) {
            fundingLines.push(`github: [${config.funding.providers.github.join(', ')}]`);
        }

        if (config.funding.providers?.open_collective) {
            fundingLines.push(`open_collective: ${config.funding.providers.open_collective}`);
        }

        if (config.funding.providers?.ko_fi) {
            fundingLines.push(`ko_fi: ${config.funding.providers.ko_fi}`);
        }

        result = result.replace(/{{FUNDING_CONTENT}}/g, fundingLines.join('\n'));
    }

    // CODEOWNERS content
    if (content.includes('{{CODEOWNERS_CONTENT}}')) {
        const codeownersLines = [];

        if (config.governance.codeowners?.owners && config.governance.codeowners.owners.length > 0) {
            codeownersLines.push(`* ${config.governance.codeowners.owners.join(' ')}`);
        }

        if (config.governance.codeowners?.paths) {
            for (const [pathPattern, owners] of Object.entries(config.governance.codeowners.paths)) {
                codeownersLines.push(`${pathPattern} ${owners.join(' ')}`);
            }
        }

        result = result.replace(/{{CODEOWNERS_CONTENT}}/g, codeownersLines.join('\n'));
    }

    return result;
}

/**
 * Apply a single action from the plan
 * @param {string} cwd
 * @param {import('./plan.mjs').PlanAction} action
 * @param {import('./config.mjs').OssDoctorConfig} config
 * @returns {Promise<void>}
 */
async function applyAction(cwd, action, config) {
    if (action.action === 'skip') {
        return;
    }

    const templatePath = getTemplatePath(action.path);
    let content = await fsp.readFile(templatePath, 'utf8');

    // Apply substitutions
    content = applySubstitutions(content, config);

    // Ensure directory exists
    await ensureDir(cwd, path.dirname(action.path));

    // Write file
    await fsp.writeFile(path.join(cwd, action.path), content, 'utf8');
}

/**
 * Apply fixes based on plan
 * @param {string} cwd
 * @param {import('./plan.mjs').PlanAction[]} plan
 * @param {import('./config.mjs').OssDoctorConfig} config
 * @returns {Promise<{changes: string[], branchName: string}>}
 */
export async function applyFixes(cwd, plan, config) {
    /** @type {string[]} */
    const changes = [];

    for (const action of plan) {
        if (action.action === 'skip') {
            continue;
        }

        // eslint-disable-next-line no-await-in-loop
        await applyAction(cwd, action, config);

        const actionVerb = action.action === 'add' ? 'added' : 'updated';

        changes.push(`${actionVerb} ${action.path}`);
    }

    const branchName = `oss-doctor/fix-${Date.now()}`;

    return {
        changes,
        branchName,
    };
}
