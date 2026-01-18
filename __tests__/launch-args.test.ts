import { describe, it, beforeAll, afterAll, expect } from "@jest/globals";
import { Test, TestingModule } from "@nestjs/testing";
import type { Browser } from "puppeteer";
import { PuppeteerModule, InjectBrowser, DEFAULT_CHROME_LAUNCH_OPTIONS } from "../src/index.js";
import { Injectable, Module } from "@nestjs/common";

@Injectable()
class BrowserService {
  constructor(@InjectBrowser() public readonly browser: Browser) {}
}

describe("Launch Args Merging", () => {
  describe("DEFAULT_CHROME_LAUNCH_OPTIONS export", () => {
    it("should export DEFAULT_CHROME_LAUNCH_OPTIONS", () => {
      expect(DEFAULT_CHROME_LAUNCH_OPTIONS).toBeDefined();
      expect(DEFAULT_CHROME_LAUNCH_OPTIONS.args).toBeDefined();
      expect(Array.isArray(DEFAULT_CHROME_LAUNCH_OPTIONS.args)).toBe(true);
    });

    it("should include expected default args", () => {
      const args = DEFAULT_CHROME_LAUNCH_OPTIONS.args as string[];
      expect(args).toContain("--allow-insecure-localhost");
      expect(args).toContain("--allow-http-screen-capture");
      expect(args).toContain("--no-zygote");
    });
  });

  describe("forRoot with custom args", () => {
    let module: TestingModule;
    let browserService: BrowserService;

    beforeAll(async () => {
      @Module({
        imports: [
          PuppeteerModule.forRoot({
            args: ["--disable-gpu", "--window-size=800,600"],
          }),
        ],
        providers: [BrowserService],
      })
      class TestModule {}

      module = await Test.createTestingModule({
        imports: [TestModule],
      }).compile();

      browserService = module.get(BrowserService);
    });

    afterAll(async () => {
      await module?.close();
    });

    it("should launch browser successfully with custom args", () => {
      expect(browserService.browser).toBeDefined();
      expect(browserService.browser.connected).toBe(true);
    });

    it("should include custom args in spawned process", () => {
      const process = browserService.browser.process();
      expect(process).toBeDefined();
      const spawnargs = process?.spawnargs ?? [];
      // Custom args should be present
      expect(spawnargs.some((arg) => arg.includes("--disable-gpu"))).toBe(true);
      expect(spawnargs.some((arg) => arg.includes("--window-size=800,600"))).toBe(true);
    });

    it("should merge custom args with default args", () => {
      const process = browserService.browser.process();
      expect(process).toBeDefined();
      const spawnargs = process?.spawnargs ?? [];
      // Default args should also be present
      expect(spawnargs.some((arg) => arg.includes("--allow-insecure-localhost"))).toBe(true);
      expect(spawnargs.some((arg) => arg.includes("--no-zygote"))).toBe(true);
    });
  });

  describe("forRoot without args uses defaults", () => {
    let module: TestingModule;
    let browserService: BrowserService;

    beforeAll(async () => {
      @Module({
        imports: [PuppeteerModule.forRoot()],
        providers: [BrowserService],
      })
      class TestModule {}

      module = await Test.createTestingModule({
        imports: [TestModule],
      }).compile();

      browserService = module.get(BrowserService);
    });

    afterAll(async () => {
      await module?.close();
    });

    it("should include default args when none provided", () => {
      const process = browserService.browser.process();
      expect(process).toBeDefined();
      const spawnargs = process?.spawnargs ?? [];
      // Default args should be present
      expect(spawnargs.some((arg) => arg.includes("--allow-insecure-localhost"))).toBe(true);
      expect(spawnargs.some((arg) => arg.includes("--no-zygote"))).toBe(true);
    });
  });

  describe("args de-duplication", () => {
    let module: TestingModule;
    let browserService: BrowserService;

    beforeAll(async () => {
      @Module({
        imports: [
          PuppeteerModule.forRoot({
            // Include a default arg to verify it's not duplicated
            args: ["--no-zygote", "--custom-arg"],
          }),
        ],
        providers: [BrowserService],
      })
      class TestModule {}

      module = await Test.createTestingModule({
        imports: [TestModule],
      }).compile();

      browserService = module.get(BrowserService);
    });

    afterAll(async () => {
      await module?.close();
    });

    it("should de-duplicate args that appear in both default and custom", () => {
      const process = browserService.browser.process();
      expect(process).toBeDefined();
      const spawnargs = process?.spawnargs ?? [];
      // Count occurrences of --no-zygote
      const noZygoteCount = spawnargs.filter((arg) => arg === "--no-zygote").length;
      expect(noZygoteCount).toBe(1);
    });

    it("should still include custom args", () => {
      const process = browserService.browser.process();
      expect(process).toBeDefined();
      const spawnargs = process?.spawnargs ?? [];
      expect(spawnargs.some((arg) => arg.includes("--custom-arg"))).toBe(true);
    });
  });

  describe("ignoreDefaultArgs: true", () => {
    let module: TestingModule;
    let browserService: BrowserService;

    beforeAll(async () => {
      @Module({
        imports: [
          PuppeteerModule.forRoot({
            ignoreDefaultArgs: true,
            args: ["--custom-only-arg"],
          }),
        ],
        providers: [BrowserService],
      })
      class TestModule {}

      module = await Test.createTestingModule({
        imports: [TestModule],
      }).compile();

      browserService = module.get(BrowserService);
    });

    afterAll(async () => {
      await module?.close();
    });

    it("should skip default args when ignoreDefaultArgs is true", () => {
      const process = browserService.browser.process();
      expect(process).toBeDefined();
      const spawnargs = process?.spawnargs ?? [];
      // Default args should NOT be present
      expect(spawnargs.some((arg) => arg.includes("--allow-insecure-localhost"))).toBe(false);
      // Custom args should be present
      expect(spawnargs.some((arg) => arg.includes("--custom-only-arg"))).toBe(true);
    });
  });

  describe("ignoreDefaultArgs: string[]", () => {
    let module: TestingModule;
    let browserService: BrowserService;

    beforeAll(async () => {
      @Module({
        imports: [
          PuppeteerModule.forRoot({
            // Filter out specific default args
            ignoreDefaultArgs: ["--no-zygote"],
            args: ["--custom-arg"],
          }),
        ],
        providers: [BrowserService],
      })
      class TestModule {}

      module = await Test.createTestingModule({
        imports: [TestModule],
      }).compile();

      browserService = module.get(BrowserService);
    });

    afterAll(async () => {
      await module?.close();
    });

    it("should filter specific default args when ignoreDefaultArgs is an array", () => {
      const process = browserService.browser.process();
      expect(process).toBeDefined();
      const spawnargs = process?.spawnargs ?? [];
      // Filtered default arg should NOT be present
      expect(spawnargs.some((arg) => arg === "--no-zygote")).toBe(false);
      // Other default args should still be present
      expect(spawnargs.some((arg) => arg.includes("--allow-insecure-localhost"))).toBe(true);
      // Custom args should be present
      expect(spawnargs.some((arg) => arg.includes("--custom-arg"))).toBe(true);
    });
  });
});
