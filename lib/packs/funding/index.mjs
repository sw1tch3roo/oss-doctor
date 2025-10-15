/**
 * Funding pack - generates .github/FUNDING.yml
 * ONLY if funding.enabled === true in config
 */

export const pack = 'funding';

/**
 * Get files for funding pack based on config
 * @param {import('../../core/config.mjs').OssDoctorConfig} config
 * @returns {string[]}
 */
export function getFiles(config) {
    if (!config.funding.enabled) {
        return [];
    }

    const { providers } = config.funding;

    if (!providers) {
        return [];
    }

    // Check if at least one provider is configured
    const hasProvider =
        (providers.github && providers.github.length > 0) || providers.open_collective || providers.ko_fi;

    if (!hasProvider) {
        return [];
    }

    return ['.github/FUNDING.yml'];
}
