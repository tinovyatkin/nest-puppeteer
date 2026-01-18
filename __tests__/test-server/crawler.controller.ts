import { Controller, Post, Body, Get, Inject } from "@nestjs/common";
import { CrawlerService } from "./crawler.service.js";
import { InjectContext, InjectBrowser } from "../../src/index.js";
import type { BrowserContext, Browser } from "puppeteer";

@Controller("crawler")
export class CrawlerController {
  constructor(
    @InjectContext() private readonly context: BrowserContext,
    @InjectBrowser() private readonly browser: Browser,
    @Inject(CrawlerService) private readonly crawlerService: CrawlerService,
  ) {}

  @Post("/")
  async crawl(@Body() params: { url: string }) {
    return this.crawlerService.crawl(params.url);
  }

  @Get("/context")
  async contextType() {
    const contexts = this.browser.browserContexts();
    const isIncognito = contexts.indexOf(this.context) !== 0;
    return { incognito: isIncognito };
  }
}
