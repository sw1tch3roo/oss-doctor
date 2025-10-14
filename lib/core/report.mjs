// @ts-check
/**
 * @param {any} r
 */
export function formatReport(r) {
    const lines = [];

    lines.push('🔍 OSS Doctor report');
    lines.push(`CI: ${r.hasCI ? '✅' : '❌'}`);

    for (const [pack, arr] of Object.entries(r.missing)) {
        if (arr.length) {
            lines.push(`⚠️ Missing (${pack}):`);

            for (const f of arr) {
                lines.push(`  - ${f}`);
            }
        }
    }

    if (Object.values(r.missing).every((x) => !x.length)) {
        lines.push('✅ Looks great!');
    }

    return lines.join('\n');
}
