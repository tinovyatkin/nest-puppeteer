import { LaunchOptions } from 'puppeteer';

export const PUPPETEER_INSTANCE_NAME = 'PuppeteerInstanceName';
export const PUPPETEER_MODULE_OPTIONS = 'PuppeteerModuleOptions';

export const DEFAULT_PUPPETEER_INSTANCE_NAME = 'DefaultPuppeteer';

const args: LaunchOptions['args'] = [
  '--allow-insecure-localhost', // Enables TLS/SSL errors on localhost to be ignored (no interstitial, no blocking of requests).
  '--allow-http-screen-capture', // Allow non-secure origins to use the screen capture API and the desktopCapture extension API.
];
// add --no-sandbox when running as root on Linux
if (typeof process.getuid === 'function' && process.getuid() === 0) {
  // console.debug('Running as root on Linux, so, add --no-sandbox to Puppeteer!');
  args.push('--no-sandbox');
}

export const DEFAULT_CHROME_LAUNCH_OPTIONS: LaunchOptions = {
  headless: true,
  pipe: true,
  args,
};
