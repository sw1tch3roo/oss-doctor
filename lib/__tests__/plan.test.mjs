import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fsp } from 'node:fs';
import path from 'node:path';
import { buildPlan, formatPlanTable, formatPlanJson } from '../core/plan.mjs';

describe('plan', () => {
    /** @type {string} */
    let testDir;

    beforeEach(async () => {
        testDir = path.join(process.cwd(), `.test-plan-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`);
        await fsp.mkdir(testDir, { recursive: true });
    });

    afterEach(async () => {
        try {
            await fsp.rm(testDir, { recursive: true, force: true });
        } catch (err) {
            // Ignore cleanup errors
        }
    });

    describe('buildPlan', () => {
        it('should add missing files', async () => {
            const scanResult = {
                missing: {
                    community: ['CODE_OF_CONDUCT.md', 'CONTRIBUTING.md'],
                    hygiene: ['.editorconfig'],
                },
                existing: [],
            };

            /** @type {any} */
            const config = { packs: ['community', 'hygiene'] };
            const plan = await buildPlan(testDir, scanResult, config);

            expect(plan).toHaveLength(3);
            expect(plan[0]).toMatchObject({
                path: 'CODE_OF_CONDUCT.md',
                action: 'add',
                reason: 'File missing',
                pack: 'community',
            });
            expect(plan[1]).toMatchObject({
                path: 'CONTRIBUTING.md',
                action: 'add',
                reason: 'File missing',
                pack: 'community',
            });
            expect(plan[2]).toMatchObject({
                path: '.editorconfig',
                action: 'add',
                reason: 'File missing',
                pack: 'hygiene',
            });
        });

        it('should skip existing files when force is false', async () => {
            await fsp.writeFile(path.join(testDir, 'CODE_OF_CONDUCT.md'), 'existing', 'utf8');

            const scanResult = {
                missing: {
                    community: ['CODE_OF_CONDUCT.md'],
                },
                existing: [],
            };

            /** @type {any} */
            const config = { packs: ['community'] };
            const plan = await buildPlan(testDir, scanResult, config, { force: false });

            expect(plan).toHaveLength(1);
            expect(plan[0]).toMatchObject({
                path: 'CODE_OF_CONDUCT.md',
                action: 'skip',
                reason: 'File exists (use --force to overwrite)',
                pack: 'community',
            });
        });

        it('should update existing files when force is true', async () => {
            await fsp.writeFile(path.join(testDir, 'CODE_OF_CONDUCT.md'), 'existing', 'utf8');

            const scanResult = {
                missing: {
                    community: ['CODE_OF_CONDUCT.md'],
                },
                existing: [],
            };

            /** @type {any} */
            const config = { packs: ['community'] };
            const plan = await buildPlan(testDir, scanResult, config, { force: true });

            expect(plan).toHaveLength(1);
            expect(plan[0]).toMatchObject({
                path: 'CODE_OF_CONDUCT.md',
                action: 'update',
                reason: 'Overwriting with --force',
                pack: 'community',
            });
        });

        it('should handle mixed scenarios with force flag', async () => {
            await fsp.writeFile(path.join(testDir, 'CODE_OF_CONDUCT.md'), 'existing', 'utf8');

            const scanResult = {
                missing: {
                    community: ['CODE_OF_CONDUCT.md', 'CONTRIBUTING.md'],
                },
                existing: [],
            };

            /** @type {any} */
            const config = { packs: ['community'] };
            const plan = await buildPlan(testDir, scanResult, config, { force: true });

            expect(plan).toHaveLength(2);
            expect(plan.find((p) => p.path === 'CODE_OF_CONDUCT.md')).toMatchObject({
                action: 'update',
                reason: 'Overwriting with --force',
            });
            expect(plan.find((p) => p.path === 'CONTRIBUTING.md')).toMatchObject({
                action: 'add',
                reason: 'File missing',
            });
        });

        it('should sort plan by pack then path', async () => {
            const scanResult = {
                missing: {
                    hygiene: ['.gitattributes', '.editorconfig'],
                    community: ['SECURITY.md', 'CODE_OF_CONDUCT.md'],
                },
                existing: [],
            };

            /** @type {any} */
            const config = { packs: ['hygiene', 'community'] };
            const plan = await buildPlan(testDir, scanResult, config);

            expect(plan[0].pack).toBe('community');
            expect(plan[0].path).toBe('CODE_OF_CONDUCT.md');
            expect(plan[1].pack).toBe('community');
            expect(plan[1].path).toBe('SECURITY.md');
            expect(plan[2].pack).toBe('hygiene');
            expect(plan[2].path).toBe('.editorconfig');
            expect(plan[3].pack).toBe('hygiene');
            expect(plan[3].path).toBe('.gitattributes');
        });

        it('should return empty plan when no missing files', async () => {
            const scanResult = {
                missing: {
                    community: [],
                },
                existing: ['CODE_OF_CONDUCT.md'],
            };

            /** @type {any} */
            const config = { packs: ['community'] };
            const plan = await buildPlan(testDir, scanResult, config);

            expect(plan).toHaveLength(0);
        });

        it('should handle non-array missing values', async () => {
            const scanResult = {
                missing: {
                    community: null,
                    hygiene: ['.editorconfig'],
                },
                existing: [],
            };

            /** @type {any} */
            const config = { packs: ['community', 'hygiene'] };
            const plan = await buildPlan(testDir, scanResult, config);

            expect(plan).toHaveLength(1);
            expect(plan[0].path).toBe('.editorconfig');
        });
    });

    describe('formatPlanTable', () => {
        it('should format empty plan', () => {
            const output = formatPlanTable([]);

            expect(output).toBe('✅ No changes needed');
        });

        it('should format plan with actions', () => {
            /** @type {any[]} */
            const plan = [
                { path: 'CODE_OF_CONDUCT.md', action: 'add', reason: 'File missing', pack: 'community' },
                { path: 'CONTRIBUTING.md', action: 'update', reason: 'Overwriting', pack: 'community' },
                { path: '.editorconfig', action: 'skip', reason: 'File exists', pack: 'hygiene' },
            ];

            const output = formatPlanTable(plan);

            expect(output).toContain('📋 Plan:');
            expect(output).toContain('community:');
            expect(output).toContain('➕ add');
            expect(output).toContain('CODE_OF_CONDUCT.md');
            expect(output).toContain('🔄 update');
            expect(output).toContain('CONTRIBUTING.md');
            expect(output).toContain('hygiene:');
            expect(output).toContain('⊘ skip');
            expect(output).toContain('.editorconfig');
        });
    });

    describe('formatPlanJson', () => {
        it('should format plan as JSON', () => {
            /** @type {any[]} */
            const plan = [{ path: 'CODE_OF_CONDUCT.md', action: 'add', reason: 'File missing', pack: 'community' }];

            const output = formatPlanJson(plan);
            const parsed = JSON.parse(output);

            expect(parsed.plan).toHaveLength(1);
            expect(parsed.plan[0]).toMatchObject({
                path: 'CODE_OF_CONDUCT.md',
                action: 'add',
                reason: 'File missing',
                pack: 'community',
            });
        });

        it('should format empty plan as JSON', () => {
            const output = formatPlanJson([]);
            const parsed = JSON.parse(output);

            expect(parsed.plan).toEqual([]);
        });
    });
});
