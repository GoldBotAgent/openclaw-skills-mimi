#!/usr/bin/env node
/**
 * Login to headrick7.com using Playwright
 * Usage: node login.js <username> <password>
 * Outputs: JSON with { success, message, title?, url? }
 *
 * Requires playwright to be installed in the workspace:
 *   cd /Users/mimi/.openclaw/workspace && npm install playwright
 */

import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';

// Resolve playwright from workspace node_modules
const workspaceDir = '/Users/mimi/.openclaw/workspace';
const require = createRequire(path.join(workspaceDir, 'package.json'));
const { chromium } = require('playwright');

const [, , username, password] = process.argv;

if (!username || !password) {
  console.error(JSON.stringify({ success: false, message: 'Usage: node login.js <username> <password>' }));
  process.exit(1);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto('https://headrick7.com/login/index.php', { waitUntil: 'domcontentloaded', timeout: 15000 });

    // Fill in login form (Moodle/CSN-style fields)
    await page.fill('input[name="username"]', username);
    await page.fill('input[name="password"]', password);

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 15000 }),
      page.click('button[type="submit"]:first-of-type'),
    ]);

    const url = page.url();
    const content = await page.textContent('body');

    if (url.includes('login') && content.toLowerCase().includes('invalid')) {
      console.log(JSON.stringify({ success: false, message: 'Invalid credentials' }));
    } else if (url.includes('login')) {
      console.log(JSON.stringify({ success: false, message: 'Login failed — still on login page', url }));
    } else {
      const title = await page.title();
      console.log(JSON.stringify({ success: true, message: 'Logged in successfully', title, url }));
    }
  } catch (err) {
    console.log(JSON.stringify({ success: false, message: err.message }));
  } finally {
    await browser.close();
  }
})();
