// @ts-check
import { promises as fsp } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * @param {string} cwd
 * @param {string} rel
 */
export async function exists(cwd, rel) {
    try {
        await fsp.access(path.join(cwd, rel));

        return true;
    } catch {
        return false;
    }
}

/**
 * @param {string} cwd
 * @param {string} rel
 */
export async function ensureDir(cwd, rel) {
    await fsp.mkdir(path.join(cwd, rel), { recursive: true });
}

/**
 * @param {string} cwd
 * @param {string} rel
 * @param {string} content
 */
export async function writeFile(cwd, rel, content) {
    await ensureDir(cwd, path.dirname(rel));
    await fsp.writeFile(path.join(cwd, rel), content, 'utf8');
}

/**
 * @param {string} cwd
 * @param {string} destRel
 * @param {string} templateRel
 */
export async function copyTemplate(cwd, destRel, templateRel) {
    // Load from project-local templates in lib/
    const projectRoot = path.resolve(__dirname, '..', '..');
    const src = path.join(projectRoot, 'lib', templateRel);
    const dst = path.join(cwd, destRel);
    const s = await fsp.readFile(src, 'utf8');

    await ensureDir(cwd, path.dirname(destRel));
    await fsp.writeFile(dst, s, 'utf8');
}

/**
 * @param {string} cwd
 * @param {string} destRel
 * @param {string} templateRel
 * @param {string[]} changes
 */
export async function writeTemplateIfMissing(cwd, destRel, templateRel, changes) {
    if (await exists(cwd, destRel)) {
        return;
    }

    await copyTemplate(cwd, destRel, templateRel);
    changes.push(`added ${destRel}`);
}
