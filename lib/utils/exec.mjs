import { spawn } from 'node:child_process';

/**
 * @typedef {Object} ExecResult
 * @property {string} stdout
 * @property {string} stderr
 */

/**
 * Execute a command and capture output
 * @param {string} cmd
 * @param {string[]} args
 * @param {any} opts
 * @returns {Promise<ExecResult>}
 */
export async function exec(cmd, args = [], opts = {}) {
    return new Promise((resolve, reject) => {
        const captureOutput = opts.captureOutput !== false;
        const spawnOpts = {
            shell: true,
            ...opts,
            stdio: captureOutput ? ['inherit', 'pipe', 'pipe'] : 'inherit',
        };

        const cp = spawn(cmd, args, spawnOpts);

        /** @type {string[]} */
        const stdoutChunks = [];
        /** @type {string[]} */
        const stderrChunks = [];

        if (captureOutput) {
            if (cp.stdout) {
                cp.stdout.on('data', (chunk) => {
                    stdoutChunks.push(chunk.toString());
                });
            }

            if (cp.stderr) {
                cp.stderr.on('data', (chunk) => {
                    stderrChunks.push(chunk.toString());
                });
            }
        }

        cp.on('exit', (code) => {
            if (code === 0) {
                resolve({
                    stdout: stdoutChunks.join(''),
                    stderr: stderrChunks.join(''),
                });
            } else {
                reject(new Error(`${cmd} exited ${code}`));
            }
        });
    });
}
