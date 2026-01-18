import { Module } from "@nestjs/common";

import { PuppeteerModule } from "../../src/index.js";
import { CrawlerController } from "./crawler.controller.js";
import { CrawlerService } from "./crawler.service.js";

@Module({
  imports: [PuppeteerModule.forFeature(["crawler"])],
  controllers: [CrawlerController],
  providers: [CrawlerService],
})
export class CrawlerModule {}
