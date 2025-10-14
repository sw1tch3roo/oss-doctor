// @ts-check
import { exec } from '../utils/exec.mjs';

/**
 * @param {string} cwd
 * @param {string} branchName
 */
export async function createPrIfRequested(cwd, branchName) {
    const ghToken = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || null;

    await exec('git', ['checkout', '-b', branchName], { cwd });
    await exec('git', ['add', '.'], { cwd });
    await exec('git', ['commit', '-m', 'chore(oss): heal repo structure'], { cwd });
    await exec('git', ['push', '-u', 'origin', branchName], { cwd });

    if (!ghToken) {
        // eslint-disable-next-line no-console
        console.log('No GITHUB_TOKEN detected. Please open PR manually or provide the token.');

        return;
    }

    try {
        await exec('gh', ['pr', 'create', '--fill'], { cwd, env: { ...process.env, GITHUB_TOKEN: ghToken } });

        return;
    } catch {}

    await exec(
        'gh',
        [
            'api',
            'repos/:owner/:repo/pulls',
            '-f',
            `head=${branchName}`,
            '-f',
            'base=main',
            '-f',
            'title=chore(oss): heal repo structure',
            '-f',
            'body=Added community, templates, hygiene, and CI files',
        ],
        { cwd, env: { ...process.env, GITHUB_TOKEN: ghToken } },
    );
}
