import process from 'node:process';
import { scanRepo } from './core/scan.mjs';
import { applyFixes } from './core/apply.mjs';
import { createPrIfRequested } from './core/git.mjs';
import { formatReport } from './core/report.mjs';

export async function main() {
    const args = process.argv.slice(2);
    const cmd = args[0] || 'check';
    const withPr = args.includes('--pr');

    if (!['check', 'fix'].includes(cmd)) {
        // eslint-disable-next-line no-console
        console.log('Usage: oss-doctor [check|fix] [--pr]');
        process.exit(1);
    }

    const cwd = process.cwd();

    const report = await scanRepo(cwd);

    if (cmd === 'check') {
        // eslint-disable-next-line no-console
        console.log(formatReport(report));
        process.exit(0);
    }

    if (cmd === 'fix') {
        const changes = await applyFixes(cwd, report);

        // eslint-disable-next-line no-console
        console.log(changes.summary);

        if (withPr) {
            await createPrIfRequested(cwd, changes.branchName);
        }
    }
}
