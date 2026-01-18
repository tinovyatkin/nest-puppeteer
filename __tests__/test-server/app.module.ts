import { Module, Logger } from "@nestjs/common";
import { AppController } from "./app.controller.js";
import { AppService } from "./app.service.js";
import type { Browser } from "puppeteer";

import { PuppeteerModule, InjectBrowser } from "../../src/index.js";
import { CrawlerModule } from "./crawler.module.js";

@Module({
  imports: [PuppeteerModule.forRoot({ isGlobal: true }), CrawlerModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  constructor(@InjectBrowser() private readonly browser: Browser) {}

  async configure() {
    const version = await this.browser.version();
    Logger.log(`Launched browser: ${version}`, "Test");
  }
}
