import { Inject } from "@nestjs/common";

import { getBrowserToken, getContextToken, getPageToken } from "./puppeteer.util.js";

/**
 * Inject the Browser object associated with a connection
 * @param instanceName The unique name associated with the browser
 */
export const InjectBrowser = (instanceName?: string) => Inject(getBrowserToken(instanceName));

/**
 * Inject the Puppeteer BrowserContext object associated with a browser
 * @param instanceName The unique name associated with the browser
 */
export const InjectContext = (instanceName?: string) => Inject(getContextToken(instanceName));

/**
 * Inject the Puppeteer Page object associated with BrowserContext
 * @param instanceName The unique name associated with the instance
 */
export const InjectPage = (instanceName?: string) => Inject(getPageToken(instanceName));
