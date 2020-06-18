import { Module } from '@nestjs/common';
import { PuppeteerModule } from '../../src/';

@Module({ imports: [PuppeteerModule.forFeature(['crawler']), CrawlerModule] })
export class CrawlerModule {}
