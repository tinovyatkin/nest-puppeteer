import { DEFAULT_PUPPETEER_INSTANCE_NAME } from './puppeteer.constants';

/**
 * Get a token for the Puppeteer instance for the given Browser name
 * @param instanceName The unique name for the Puppeteer instance
 */
export function getBrowserToken(
  instanceName: string = DEFAULT_PUPPETEER_INSTANCE_NAME,
): string {
  return `${instanceName}Browser`;
}

/**
 * Get a token for the Puppeteer instance for the given BrowserContext name
 * @param instanceName The unique name for the Puppeteer instance
 */
export function getContextToken(
  instanceName: string = DEFAULT_PUPPETEER_INSTANCE_NAME,
): string {
  return `${instanceName}Context`;
}

/**
 * Get a token for the Puppeteer instance for the given Page name
 * @param instanceName The unique name for the Puppeteer instance
 */
export function getPageToken(
  instanceName: string = DEFAULT_PUPPETEER_INSTANCE_NAME,
): string {
  return `${instanceName}Page`;
}
