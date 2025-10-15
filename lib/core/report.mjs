/**
 * Format scan results as human-readable report
 * @param {any} scanResult
 * @returns {string}
 */
export function formatReport(scanResult) {
    const lines = [];

    lines.push('🔍 OSS Doctor Report');
    lines.push('');

    // Report missing files by pack
    let hasIssues = false;

    for (const [pack, files] of Object.entries(scanResult.missing)) {
        if (!Array.isArray(files) || files.length === 0) {
            continue;
        }

        hasIssues = true;
        lines.push(`⚠️  Missing (${pack}):`);

        for (const file of files) {
            lines.push(`  - ${file}`);
        }

        lines.push('');
    }

    // Report README health if available
    if (scanResult.readmeHealth) {
        const { missing, suggestions } = scanResult.readmeHealth;

        if (missing.length > 0) {
            hasIssues = true;
            lines.push('📄 README Health:');

            for (const section of missing) {
                lines.push(`  - Missing section: ${section}`);
            }

            lines.push('');
        }

        if (suggestions.length > 0) {
            for (const suggestion of suggestions) {
                lines.push(`💡 ${suggestion}`);
            }

            lines.push('');
        }
    }

    if (!hasIssues) {
        lines.push('✅ All checks passed!');
    }

    return lines.join('\n');
}

/**
 * Format scan results as JSON
 * @param {any} scanResult
 * @returns {string}
 */
export function formatReportJson(scanResult) {
    return JSON.stringify(scanResult, null, 2);
}
