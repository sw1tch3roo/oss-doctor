import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fsp } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfig } from '../core/config.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const testDir = path.join(__dirname, '../../.test-tmp');

describe('Config', () => {
    beforeEach(async () => {
        await fsp.mkdir(testDir, { recursive: true });
    });

    afterEach(async () => {
        await fsp.rm(testDir, { recursive: true, force: true });
    });

    it('should return defaults when no config file exists', async () => {
        const config = await loadConfig(testDir);

        expect(config.packs).toEqual(['community', 'hygiene', 'project', 'workflows', 'docs']);
        expect(config.funding.enabled).toBe(false);
        expect(config.governance.enabled).toBe(false);
        expect(config.workflows.ciNode).toBe(20);
    });

    it('should merge user config with defaults', async () => {
        const userConfig = {
            packs: ['community', 'funding'],
            funding: {
                enabled: true,
                providers: {
                    github: ['testuser'],
                },
            },
        };

        await fsp.writeFile(path.join(testDir, '.ossdoctor.json'), JSON.stringify(userConfig), 'utf8');

        const config = await loadConfig(testDir);

        expect(config.packs).toEqual(['community', 'funding']);
        expect(config.funding.enabled).toBe(true);
        expect(config.funding.providers?.github).toEqual(['testuser']);
        expect(config.workflows.ciNode).toBe(20); // Default preserved
    });

    it('should handle funding enabled without providers', async () => {
        const userConfig = {
            funding: {
                enabled: true,
                providers: {},
            },
        };

        await fsp.writeFile(path.join(testDir, '.ossdoctor.json'), JSON.stringify(userConfig), 'utf8');

        const config = await loadConfig(testDir);

        expect(config.funding.enabled).toBe(true);
        expect(config.funding.providers).toEqual({});
    });

    it('should handle governance config', async () => {
        const userConfig = {
            governance: {
                enabled: true,
                codeowners: {
                    mode: 'explicit',
                    owners: ['@org/team'],
                    paths: {
                        'src/**': ['@org/frontend'],
                    },
                },
            },
        };

        await fsp.writeFile(path.join(testDir, '.ossdoctor.json'), JSON.stringify(userConfig), 'utf8');

        const config = await loadConfig(testDir);

        expect(config.governance.enabled).toBe(true);
        expect(config.governance.codeowners?.mode).toBe('explicit');
        expect(config.governance.codeowners?.owners).toEqual(['@org/team']);
    });

    it('should handle contacts config', async () => {
        const userConfig = {
            contacts: {
                securityEmail: 'security@example.com',
            },
        };

        await fsp.writeFile(path.join(testDir, '.ossdoctor.json'), JSON.stringify(userConfig), 'utf8');

        const config = await loadConfig(testDir);

        expect(config.contacts?.securityEmail).toBe('security@example.com');
    });
});
