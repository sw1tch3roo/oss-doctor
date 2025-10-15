import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fsp } from 'node:fs';
import path from 'node:path';
import { scanRepo } from '../core/scan.mjs';

describe('scan', () => {
    /** @type {string} */
    let testDir;

    beforeEach(async () => {
        testDir = path.join(process.cwd(), `.test-${Date.now()}`);
        await fsp.mkdir(testDir, { recursive: true });
    });

    afterEach(async () => {
        await fsp.rm(testDir, { recursive: true, force: true });
    });

    describe('scanRepo', () => {
        it('should detect missing community files', async () => {
            /** @type {any} */
            const config = {
                packs: ['community'],
                funding: { enabled: false },
                governance: { enabled: false },
                workflows: { changesetsFlow: false },
                project: { stale: { enabled: false }, triage: { enabled: false } },
                docs: { readmeHealth: false },
            };

            const result = await scanRepo(testDir, config);

            expect(result.missing.community).toEqual(['CODE_OF_CONDUCT.md', 'CONTRIBUTING.md', 'SECURITY.md']);
            expect(result.existing).toEqual([]);
        });

        it('should detect missing hygiene files', async () => {
            /** @type {any} */
            const config = {
                packs: ['hygiene'],
                funding: { enabled: false },
                governance: { enabled: false },
                workflows: { changesetsFlow: false },
                project: { stale: { enabled: false }, triage: { enabled: false } },
                docs: { readmeHealth: false },
            };

            const result = await scanRepo(testDir, config);

            expect(result.missing.hygiene).toEqual(['.editorconfig', '.gitattributes']);
            expect(result.existing).toEqual([]);
        });

        it('should detect missing project files', async () => {
            /** @type {any} */
            const config = {
                packs: ['project'],
                funding: { enabled: false },
                governance: { enabled: false },
                workflows: { changesetsFlow: false },
                project: { stale: { enabled: false }, triage: { enabled: false } },
                docs: { readmeHealth: false },
            };

            const result = await scanRepo(testDir, config);

            expect(result.missing.project).toEqual([
                '.github/ISSUE_TEMPLATE/bug_report.yml',
                '.github/ISSUE_TEMPLATE/feature_request.yml',
                '.github/ISSUE_TEMPLATE/question.yml',
                '.github/PULL_REQUEST_TEMPLATE.md',
            ]);
            expect(result.existing).toEqual([]);
        });

        it('should detect missing workflow files', async () => {
            /** @type {any} */
            const config = {
                packs: ['workflows'],
                funding: { enabled: false },
                governance: { enabled: false },
                workflows: { changesetsFlow: false },
                project: { stale: { enabled: false }, triage: { enabled: false } },
                docs: { readmeHealth: false },
            };

            const result = await scanRepo(testDir, config);

            expect(result.missing.workflows).toEqual(['.github/workflows/ci.yml']);
            expect(result.existing).toEqual([]);
        });

        it('should detect existing files', async () => {
            await fsp.writeFile(path.join(testDir, 'CODE_OF_CONDUCT.md'), 'content', 'utf8');
            await fsp.writeFile(path.join(testDir, '.editorconfig'), 'content', 'utf8');

            /** @type {any} */
            const config = {
                packs: ['community', 'hygiene'],
                funding: { enabled: false },
                governance: { enabled: false },
                workflows: { changesetsFlow: false },
                project: { stale: { enabled: false }, triage: { enabled: false } },
                docs: { readmeHealth: false },
            };

            const result = await scanRepo(testDir, config);

            expect(result.existing).toContain('CODE_OF_CONDUCT.md');
            expect(result.existing).toContain('.editorconfig');
            expect(result.missing.community).not.toContain('CODE_OF_CONDUCT.md');
            expect(result.missing.hygiene).not.toContain('.editorconfig');
        });

        it('should not include funding files when disabled', async () => {
            /** @type {any} */
            const config = {
                packs: ['funding'],
                funding: {
                    enabled: false,
                    providers: { github: ['user'] },
                },
                governance: { enabled: false },
                workflows: { changesetsFlow: false },
                project: { stale: { enabled: false }, triage: { enabled: false } },
                docs: { readmeHealth: false },
            };

            const result = await scanRepo(testDir, config);

            expect(result.missing.funding).toEqual([]);
        });

        it('should not include funding files when enabled but no providers', async () => {
            /** @type {any} */
            const config = {
                packs: ['funding'],
                funding: {
                    enabled: true,
                    providers: {},
                },
                governance: { enabled: false },
                workflows: { changesetsFlow: false },
                project: { stale: { enabled: false }, triage: { enabled: false } },
                docs: { readmeHealth: false },
            };

            const result = await scanRepo(testDir, config);

            expect(result.missing.funding).toEqual([]);
        });

        it('should include funding files when enabled and has providers', async () => {
            /** @type {any} */
            const config = {
                packs: ['funding'],
                funding: {
                    enabled: true,
                    providers: {
                        github: ['testuser'],
                    },
                },
                governance: { enabled: false },
                workflows: { changesetsFlow: false },
                project: { stale: { enabled: false }, triage: { enabled: false } },
                docs: { readmeHealth: false },
            };

            const result = await scanRepo(testDir, config);

            expect(result.missing.funding).toEqual(['.github/FUNDING.yml']);
        });

        it('should not include governance files when disabled', async () => {
            /** @type {any} */
            const config = {
                packs: ['governance'],
                funding: { enabled: false },
                governance: {
                    enabled: false,
                    codeowners: {
                        mode: 'explicit',
                        owners: ['@org/team'],
                    },
                },
                workflows: { changesetsFlow: false },
                project: { stale: { enabled: false }, triage: { enabled: false } },
                docs: { readmeHealth: false },
            };

            const result = await scanRepo(testDir, config);

            expect(result.missing.governance).toEqual([]);
        });

        it('should not include governance files when mode is none', async () => {
            /** @type {any} */
            const config = {
                packs: ['governance'],
                funding: { enabled: false },
                governance: {
                    enabled: true,
                    codeowners: {
                        mode: 'none',
                    },
                },
                workflows: { changesetsFlow: false },
                project: { stale: { enabled: false }, triage: { enabled: false } },
                docs: { readmeHealth: false },
            };

            const result = await scanRepo(testDir, config);

            expect(result.missing.governance).toEqual([]);
        });

        it('should not include governance files when explicit mode but no owners', async () => {
            /** @type {any} */
            const config = {
                packs: ['governance'],
                funding: { enabled: false },
                governance: {
                    enabled: true,
                    codeowners: {
                        mode: 'explicit',
                        owners: [],
                    },
                },
                workflows: { changesetsFlow: false },
                project: { stale: { enabled: false }, triage: { enabled: false } },
                docs: { readmeHealth: false },
            };

            const result = await scanRepo(testDir, config);

            expect(result.missing.governance).toEqual([]);
        });

        it('should include governance files when enabled with valid config', async () => {
            /** @type {any} */
            const config = {
                packs: ['governance'],
                funding: { enabled: false },
                governance: {
                    enabled: true,
                    codeowners: {
                        mode: 'explicit',
                        owners: ['@org/team'],
                    },
                },
                workflows: { changesetsFlow: false },
                project: { stale: { enabled: false }, triage: { enabled: false } },
                docs: { readmeHealth: false },
            };

            const result = await scanRepo(testDir, config);

            expect(result.missing.governance).toEqual(['CODEOWNERS']);
        });

        it('should only include ci workflow by default', async () => {
            /** @type {any} */
            const config = {
                packs: ['workflows'],
                funding: { enabled: false },
                governance: { enabled: false },
                workflows: { changesetsFlow: false },
                project: { stale: { enabled: false }, triage: { enabled: false } },
                docs: { readmeHealth: false },
            };

            const result = await scanRepo(testDir, config);

            expect(result.missing.workflows).toEqual(['.github/workflows/ci.yml']);
        });

        it('should match static workflow files only', async () => {
            // Note: workflows pack uses static file list from PACK_FILES
            // Dynamic workflow additions (changesets, labels, stale, triage)
            // are not currently implemented in getFilesForPack
            /** @type {any} */
            const config = {
                packs: ['workflows'],
                funding: { enabled: false },
                governance: { enabled: false },
                workflows: { changesetsFlow: true },
                project: {
                    labels: './labels.json',
                    stale: { enabled: true, days: 60 },
                    triage: { enabled: true },
                },
                docs: { readmeHealth: false },
            };

            const result = await scanRepo(testDir, config);

            // Current implementation only returns static ci.yml
            expect(result.missing.workflows).toEqual(['.github/workflows/ci.yml']);
        });

        it('should only scan enabled packs', async () => {
            /** @type {any} */
            const config = {
                packs: ['community'],
                funding: { enabled: false },
                governance: { enabled: false },
                workflows: { changesetsFlow: false },
                project: { stale: { enabled: false }, triage: { enabled: false } },
                docs: { readmeHealth: false },
            };

            const result = await scanRepo(testDir, config);

            expect(result.missing.community).toBeDefined();
            expect(result.missing.hygiene).toBeUndefined();
            expect(result.missing.project).toBeUndefined();
        });

        it('should handle multiple packs together', async () => {
            /** @type {any} */
            const config = {
                packs: ['community', 'hygiene', 'project'],
                funding: { enabled: false },
                governance: { enabled: false },
                workflows: { changesetsFlow: false },
                project: { stale: { enabled: false }, triage: { enabled: false } },
                docs: { readmeHealth: false },
            };

            const result = await scanRepo(testDir, config);

            expect(result.missing.community).toHaveLength(3);
            expect(result.missing.hygiene).toHaveLength(2);
            expect(result.missing.project).toHaveLength(4);
        });
    });
});
