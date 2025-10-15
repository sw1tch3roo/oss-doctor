import process from 'node:process';
import { promises as fsp } from 'node:fs';
import path from 'node:path';
import { loadConfig, getDefaultConfigJson } from './core/config.mjs';
import { scanRepo } from './core/scan.mjs';
import { buildPlan, formatPlanTable, formatPlanJson } from './core/plan.mjs';
import { applyFixes } from './core/apply.mjs';
import { createPrIfRequested } from './core/git.mjs';
import { formatReport, formatReportJson } from './core/report.mjs';
import { syncLabels } from './core/labels.mjs';

/**
 * Parse command line arguments
 * @param {string[]} args
 * @returns {{cmd: string, options: Record<string, any>}}
 */
function parseArgs(args) {
    const cmd = args[0] || 'check';
    const options = {};

    for (let i = 1; i < args.length; i++) {
        const arg = args[i];

        if (arg === '--pack' && i + 1 < args.length) {
            options.pack = args[i + 1].split(',');
            i++;
        } else if (arg === '--json') {
            options.json = true;
        } else if (arg === '--pr') {
            options.pr = true;
        } else if (arg === '--yes' || arg === '-y') {
            options.yes = true;
        } else if (arg === '--force') {
            options.force = true;
        } else if (arg === '--prune') {
            options.prune = true;
        }
    }

    return { cmd, options };
}

/**
 * Main CLI entry point
 */
export async function main() {
    const args = process.argv.slice(2);
    const { cmd, options } = parseArgs(args);

    const cwd = process.cwd();

    // Handle init command
    if (cmd === 'init') {
        const configPath = path.join(cwd, '.ossdoctor.json');

        try {
            await fsp.access(configPath);
            // eslint-disable-next-line no-console
            console.log('⚠️  .ossdoctor.json already exists');
            process.exit(1);
        } catch {
            // File doesn't exist, create it
            await fsp.writeFile(configPath, getDefaultConfigJson(), 'utf8');
            // eslint-disable-next-line no-console
            console.log('✅ Created .ossdoctor.json');
            // eslint-disable-next-line no-console
            console.log('Edit the file to configure oss-doctor for your project.');
            process.exit(0);
        }
    }

    // Handle labels sync command
    if (cmd === 'labels' && args[1] === 'sync') {
        const config = await loadConfig(cwd);

        if (!config.project.labels) {
            // eslint-disable-next-line no-console
            console.log('⚠️  No labels path configured');
            // eslint-disable-next-line no-console
            console.log('Add "project.labels" to .ossdoctor.json');
            process.exit(1);
        }

        await syncLabels(cwd, config.project.labels, { prune: options.prune });
        process.exit(0);
    }

    // Load configuration
    const config = await loadConfig(cwd);

    // Override packs if --pack option provided
    if (options.pack) {
        config.packs = options.pack;
    }

    // Scan repository
    const scanResult = await scanRepo(cwd, config);

    // Handle check command
    if (cmd === 'check') {
        const output = options.json ? formatReportJson(scanResult) : formatReport(scanResult);

        // eslint-disable-next-line no-console
        console.log(output);
        process.exit(0);
    }

    // Build plan
    const plan = await buildPlan(cwd, scanResult, config, { force: options.force });

    // Handle plan command
    if (cmd === 'plan') {
        const output = options.json ? formatPlanJson(plan) : formatPlanTable(plan);

        // eslint-disable-next-line no-console
        console.log(output);
        process.exit(0);
    }

    // Handle fix command
    if (cmd === 'fix') {
        // Show plan first unless --yes
        if (!options.yes) {
            // eslint-disable-next-line no-console
            console.log(formatPlanTable(plan));
            // eslint-disable-next-line no-console
            console.log('');
            // eslint-disable-next-line no-console
            console.log('Run with --yes to apply these changes');
            process.exit(0);
        }

        // Apply fixes
        const result = await applyFixes(cwd, plan, config);

        // eslint-disable-next-line no-console
        console.log('💉 Applied fixes:');

        for (const change of result.changes) {
            // eslint-disable-next-line no-console
            console.log(`  ✓ ${change}`);
        }

        // Create PR if requested
        if (options.pr) {
            // eslint-disable-next-line no-console
            console.log('');
            // eslint-disable-next-line no-console
            console.log('📤 Creating pull request...');
            await createPrIfRequested(cwd, result.branchName, result.changes, config.packs);
        }

        process.exit(0);
    }

    // Unknown command
    // eslint-disable-next-line no-console
    console.log('Usage:');
    // eslint-disable-next-line no-console
    console.log('  oss-doctor check [--pack <packs>] [--json]');
    // eslint-disable-next-line no-console
    console.log('  oss-doctor plan  [--pack <packs>] [--json]');
    // eslint-disable-next-line no-console
    console.log('  oss-doctor fix   [--pack <packs>] [--pr] [--yes] [--force]');
    // eslint-disable-next-line no-console
    console.log('  oss-doctor labels sync [--prune]');
    // eslint-disable-next-line no-console
    console.log('  oss-doctor init');
    process.exit(1);
}
