#!/usr/bin/env node
import { main } from '../lib/index.mjs';

main().catch((e) => {
    // eslint-disable-next-line no-console
    console.error('[oss-doctor] Error:', e?.stack || e?.message || e);
    process.exit(1);
});
