import { Provider } from "@nestjs/common";
import { Browser, BrowserContext, Page } from "puppeteer";

import { getBrowserToken, getContextToken, getPageToken } from "./puppeteer.util.js";

/**
 * Options for creating mock Puppeteer providers
 */
export interface MockPuppeteerOptions {
  /**
   * The unique name for the Puppeteer instance.
   * Must match the instanceName used in forRoot/forRootAsync.
   */
  instanceName?: string;
  /**
   * Mock value for the Browser. If not provided, an empty object is used.
   * Can be a partial Browser object or any mock implementation.
   */
  browser?: Partial<Browser> | unknown;
  /**
   * Mock value for the BrowserContext. If not provided, an empty object is used.
   * Can be a partial BrowserContext object or any mock implementation.
   */
  context?: Partial<BrowserContext> | unknown;
  /**
   * Mock value for the Page. If not provided, an empty object is used.
   * Can be a partial Page object or any mock implementation.
   */
  page?: Partial<Page> | unknown;
}

/**
 * Creates mock providers for Puppeteer Browser, BrowserContext, and Page.
 * Use this function in unit tests to provide mock implementations when testing
 * controllers or services that inject Puppeteer dependencies.
 *
 * @example
 * ```typescript
 * import { Test } from '@nestjs/testing';
 * import { createMockPuppeteerProviders } from 'nest-puppeteer';
 *
 * describe('MyController', () => {
 *   let controller: MyController;
 *
 *   beforeEach(async () => {
 *     const mockPage = {
 *       goto: jest.fn().mockResolvedValue(undefined),
 *       content: jest.fn().mockResolvedValue('<html></html>'),
 *     };
 *
 *     const module = await Test.createTestingModule({
 *       controllers: [MyController],
 *       providers: [
 *         MyService,
 *         ...createMockPuppeteerProviders({
 *           page: mockPage,
 *           browser: { connected: true },
 *           context: { isIncognito: () => true },
 *         }),
 *       ],
 *     }).compile();
 *
 *     controller = module.get(MyController);
 *   });
 * });
 * ```
 *
 * @param options - Options for creating mock providers
 * @returns An array of NestJS providers for Browser, BrowserContext, and Page
 */
export function createMockPuppeteerProviders(options: MockPuppeteerOptions = {}): Provider[] {
  const { instanceName, browser = {}, context = {}, page = {} } = options;

  return [
    {
      provide: getBrowserToken(instanceName),
      useValue: browser,
    },
    {
      provide: getContextToken(instanceName),
      useValue: context,
    },
    {
      provide: getPageToken(instanceName),
      useValue: page,
    },
  ];
}
