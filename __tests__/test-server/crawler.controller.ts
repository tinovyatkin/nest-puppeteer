import { Controller, Post, Body } from '@nestjs/common';
import { CrawlerService } from './crawler.service';

@Controller('crawler')
export class CrawlerController {
  constructor(private readonly crawlerService: CrawlerService) {}

  @Post('/')
  async crawl(@Body() params: { url: string }) {
    return this.crawlerService.crawl(params.url);
  }
}
