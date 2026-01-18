import { describe, it, beforeEach, expect, jest } from "@jest/globals";
import { Test, TestingModule } from "@nestjs/testing";
import { Controller, Injectable } from "@nestjs/common";
import type { Browser, BrowserContext, Page } from "puppeteer";
import {
  createMockPuppeteerProviders,
  InjectBrowser,
  InjectContext,
  InjectPage,
  getBrowserToken,
  getContextToken,
  getPageToken,
} from "../src/index.js";

// Example service that uses Puppeteer Page
@Injectable()
class TestCrawlerService {
  constructor(@InjectPage() private readonly page: Page) {}

  async getPageTitle(url: string): Promise<string> {
    await this.page.goto(url);
    return this.page.title();
  }
}

// Example controller that uses Browser and BrowserContext
@Controller("test")
class TestController {
  constructor(
    @InjectBrowser() private readonly browser: Browser,
    @InjectContext() private readonly context: BrowserContext,
  ) {}

  async getBrowserVersion(): Promise<string> {
    return this.browser.version();
  }

  getBrowser(): Browser {
    return this.context.browser();
  }
}

describe("createMockPuppeteerProviders", () => {
  describe("unit testing a service with mocked Page", () => {
    let service: TestCrawlerService;
    let mockPage: Partial<Page>;

    beforeEach(async () => {
      // Create mock implementations for Page methods
      mockPage = {
        goto: jest.fn<Page["goto"]>().mockResolvedValue(null),
        title: jest.fn<Page["title"]>().mockResolvedValue("Mocked Page Title"),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          TestCrawlerService,
          ...createMockPuppeteerProviders({
            page: mockPage,
          }),
        ],
      }).compile();

      service = module.get(TestCrawlerService);
    });

    it("should inject the mocked page", async () => {
      const title = await service.getPageTitle("https://example.com");

      expect(title).toBe("Mocked Page Title");
      expect(mockPage.goto).toHaveBeenCalledWith("https://example.com");
      expect(mockPage.title).toHaveBeenCalled();
    });
  });

  describe("unit testing a controller with mocked Browser and Context", () => {
    let controller: TestController;
    let mockBrowser: Partial<Browser>;
    let mockContext: Partial<BrowserContext>;

    beforeEach(async () => {
      // Create mock implementations
      mockBrowser = {
        version: jest.fn<Browser["version"]>().mockResolvedValue("Chrome/120.0.0.0"),
      };

      mockContext = {
        browser: jest.fn<BrowserContext["browser"]>().mockReturnValue(mockBrowser as Browser),
      };

      const module: TestingModule = await Test.createTestingModule({
        controllers: [TestController],
        providers: [
          ...createMockPuppeteerProviders({
            browser: mockBrowser,
            context: mockContext,
          }),
        ],
      }).compile();

      controller = module.get(TestController);
    });

    it("should inject the mocked browser", async () => {
      const version = await controller.getBrowserVersion();

      expect(version).toBe("Chrome/120.0.0.0");
      expect(mockBrowser.version).toHaveBeenCalled();
    });

    it("should inject the mocked context", () => {
      const browser = controller.getBrowser();

      expect(browser).toBe(mockBrowser);
      expect(mockContext.browser).toHaveBeenCalled();
    });
  });

  describe("with named instance", () => {
    let service: TestNamedService;
    let mockPage: Partial<Page>;

    // Service using a named instance
    @Injectable()
    class TestNamedService {
      constructor(@InjectPage("secondary") private readonly page: Page) {}

      async getContent(): Promise<string> {
        return this.page.content();
      }
    }

    beforeEach(async () => {
      mockPage = {
        content: jest.fn<Page["content"]>().mockResolvedValue("<html>mock</html>"),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          TestNamedService,
          ...createMockPuppeteerProviders({
            instanceName: "secondary",
            page: mockPage,
          }),
        ],
      }).compile();

      service = module.get(TestNamedService);
    });

    it("should inject mocked page for named instance", async () => {
      const content = await service.getContent();

      expect(content).toBe("<html>mock</html>");
      expect(mockPage.content).toHaveBeenCalled();
    });
  });

  describe("token generation", () => {
    it("should use correct tokens for default instance", () => {
      const providers = createMockPuppeteerProviders({
        browser: { connected: true },
        context: {},
        page: {},
      });

      expect(providers).toHaveLength(3);
      expect(providers[0]).toMatchObject({
        provide: getBrowserToken(),
        useValue: { connected: true },
      });
      expect(providers[1]).toMatchObject({
        provide: getContextToken(),
      });
      expect(providers[2]).toMatchObject({
        provide: getPageToken(),
      });
    });

    it("should use correct tokens for named instance", () => {
      const providers = createMockPuppeteerProviders({
        instanceName: "custom",
      });

      expect(providers[0]).toMatchObject({
        provide: getBrowserToken("custom"),
      });
      expect(providers[1]).toMatchObject({
        provide: getContextToken("custom"),
      });
      expect(providers[2]).toMatchObject({
        provide: getPageToken("custom"),
      });
    });
  });
});
