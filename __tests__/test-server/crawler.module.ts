import { Module } from '@nestjs/common';
import { PuppeteerModule } from '../../src/';

@Module({ imports: [PuppeteerModule.forFeature(), CrawlerModule] })
export class CrawlerModule {}
