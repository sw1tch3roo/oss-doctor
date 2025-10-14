// @ts-check
import { scanRepo } from '../core/scan.mjs';
import { applyFixes } from '../core/apply.mjs';
import { createPrIfRequested } from '../core/git.mjs';

const cwd = process.cwd();
const report = await scanRepo(cwd);
const changes = await applyFixes(cwd, report);

await createPrIfRequested(cwd, changes.branchName);
