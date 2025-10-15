import { promises as fsp } from 'node:fs';
import path from 'node:path';

/**
 * @typedef {Object} ContactsConfig
 * @property {string} [securityEmail] - Email for security reports (used in SECURITY.md, CoC)
 */

/**
 * @typedef {Object} WorkflowsConfig
 * @property {number} ciNode - Node version for CI workflows
 * @property {boolean} changesetsFlow - Install prepare-release/release workflows
 */

/**
 * @typedef {Object} FundingConfig
 * @property {boolean} enabled - Must be true to create FUNDING.yml
 * @property {Object} [providers]
 * @property {string[]} [providers.github] - Array of GitHub usernames
 * @property {string} [providers.open_collective] - Open Collective slug
 * @property {string} [providers.ko_fi] - Ko-fi username
 */

/**
 * @typedef {Object} CodeownersConfig
 * @property {'explicit'|'top-contributors'|'none'} mode - How to generate CODEOWNERS
 * @property {string[]} [owners] - Default owners
 * @property {Object.<string, string[]>} [paths] - Path-specific owners
 */

/**
 * @typedef {Object} GovernanceConfig
 * @property {boolean} enabled - Must be true to generate governance files
 * @property {CodeownersConfig} [codeowners]
 */

/**
 * @typedef {Object} StaleConfig
 * @property {boolean} enabled
 * @property {number} [days]
 * @property {string[]} [exceptLabels]
 */

/**
 * @typedef {Object} TriageConfig
 * @property {boolean} enabled
 */

/**
 * @typedef {Object} ProjectConfig
 * @property {string} [labels] - Path to labels.json file
 * @property {StaleConfig} [stale]
 * @property {TriageConfig} [triage]
 */

/**
 * @typedef {Object} DocsConfig
 * @property {boolean} readmeHealth - Check README sections (no auto-write)
 */

/**
 * @typedef {Object} OssDoctorConfig
 * @property {string[]} packs - Enabled packs
 * @property {ContactsConfig} [contacts]
 * @property {WorkflowsConfig} workflows
 * @property {FundingConfig} funding
 * @property {GovernanceConfig} governance
 * @property {ProjectConfig} project
 * @property {DocsConfig} docs
 */

/**
 * Default configuration
 * @returns {OssDoctorConfig}
 */
function getDefaultConfig() {
    return {
        packs: ['community', 'hygiene', 'project', 'workflows', 'docs'],
        contacts: {},
        workflows: {
            ciNode: 20,
            changesetsFlow: false,
        },
        funding: {
            enabled: false,
            providers: {},
        },
        governance: {
            enabled: false,
            codeowners: {
                mode: 'none',
                owners: [],
                paths: {},
            },
        },
        project: {
            stale: { enabled: false, days: 60, exceptLabels: ['pinned', 'security'] },
            triage: { enabled: true },
        },
        docs: {
            readmeHealth: true,
        },
    };
}

/**
 * Load and merge config from .ossdoctor.json
 * @param {string} cwd
 * @returns {Promise<OssDoctorConfig>}
 */
export async function loadConfig(cwd) {
    const configPath = path.join(cwd, '.ossdoctor.json');
    const defaults = getDefaultConfig();

    try {
        const content = await fsp.readFile(configPath, 'utf8');
        const userConfig = JSON.parse(content);

        // Deep merge user config with defaults
        /** @type {OssDoctorConfig} */
        return {
            packs: userConfig.packs || defaults.packs,
            contacts: { ...defaults.contacts, ...(userConfig.contacts || {}) },
            workflows: { ...defaults.workflows, ...(userConfig.workflows || {}) },
            funding: {
                enabled: userConfig.funding?.enabled ?? defaults.funding.enabled,
                providers: { ...defaults.funding.providers, ...(userConfig.funding?.providers || {}) },
            },
            governance: {
                enabled: userConfig.governance?.enabled ?? defaults.governance.enabled,
                codeowners: {
                    mode: userConfig.governance?.codeowners?.mode ?? defaults.governance.codeowners?.mode ?? 'none',
                    owners: userConfig.governance?.codeowners?.owners ?? defaults.governance.codeowners?.owners ?? [],
                    paths: userConfig.governance?.codeowners?.paths ?? defaults.governance.codeowners?.paths ?? {},
                },
            },
            project: {
                labels: userConfig.project?.labels,
                stale: {
                    enabled: userConfig.project?.stale?.enabled ?? defaults.project.stale?.enabled ?? false,
                    days: userConfig.project?.stale?.days ?? defaults.project.stale?.days ?? 60,
                    exceptLabels: userConfig.project?.stale?.exceptLabels ?? defaults.project.stale?.exceptLabels ?? [],
                },
                triage: {
                    enabled: userConfig.project?.triage?.enabled ?? defaults.project.triage?.enabled ?? false,
                },
            },
            docs: {
                readmeHealth: userConfig.docs?.readmeHealth ?? defaults.docs.readmeHealth,
            },
        };
    } catch (err) {
        if (err && typeof err === 'object' && 'code' in err && err.code === 'ENOENT') {
            return defaults;
        }

        const message = err && typeof err === 'object' && 'message' in err ? err.message : 'Unknown error';

        throw new Error(`Failed to load .ossdoctor.json: ${message}`);
    }
}

/**
 * Get default config as JSON string for init command
 * @returns {string}
 */
export function getDefaultConfigJson() {
    const config = {
        $schema: 'https://unpkg.com/oss-doctor-schema@1/schema.json',
        packs: ['community', 'hygiene', 'project', 'workflows', 'docs'],
        contacts: {
            securityEmail: 'security@example.org',
        },
        workflows: {
            ciNode: 20,
            changesetsFlow: false,
        },
        funding: {
            enabled: false,
            providers: {
                github: ['your-username'],
                open_collective: 'your-collective',
                ko_fi: 'your-kofi',
            },
        },
        governance: {
            enabled: false,
            codeowners: {
                mode: 'explicit',
                owners: ['@org/team-repo'],
                paths: {
                    'src/**': ['@org/team-repo'],
                },
            },
        },
        project: {
            labels: './lib/packs/templates/labels.json',
            stale: { enabled: false, days: 60, exceptLabels: ['pinned', 'security'] },
            triage: { enabled: true },
        },
        docs: {
            readmeHealth: true,
        },
    };

    return JSON.stringify(config, null, 4);
}
