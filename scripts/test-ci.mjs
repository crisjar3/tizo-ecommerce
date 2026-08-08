import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { chromium } from '@playwright/test';

const ngCli = fileURLToPath(new URL('../node_modules/@angular/cli/bin/ng.js', import.meta.url));
const result = spawnSync(
  process.execPath,
  [ngCli, 'test', '--watch=false', '--browsers=ChromeHeadless', '--code-coverage'],
  {
    env: { ...process.env, CHROME_BIN: chromium.executablePath() },
    stdio: 'inherit',
  },
);

if (result.error) {
  console.error(result.error);
}

process.exit(result.status ?? 1);
