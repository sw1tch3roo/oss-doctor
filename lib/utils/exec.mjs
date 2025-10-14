// @ts-check
import { spawn } from 'node:child_process';

/**
 * @param {string} cmd
 * @param {string[]} args
 * @param {any} opts
 * @returns {Promise<void>}
 */
export async function exec(cmd, args = [], opts = {}) {
    return new Promise((resolve, reject) => {
        const cp = spawn(cmd, args, { stdio: 'inherit', shell: true, ...opts });

        cp.on('exit', (code) => (code === 0 ? resolve(undefined) : reject(new Error(`${cmd} exited ${code}`))));
    });
}
