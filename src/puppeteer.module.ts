import { Module, DynamicModule } from '@nestjs/common';
import { createPuppeteerProviders } from './puppeteer.providers';
import { PuppeteerCoreModule } from './puppeteer-core.module';
import type {
  PuppeteerModuleAsyncOptions,
  PuppeteerModuleOptions,
} from './interfaces/puppeteer-options.interface';

/**
 * Module for the Puppeteer
 */
@Module({})
export class PuppeteerModule {
  /**
   * Inject the Puppeteer synchronously.
   * @param options Options for the Browser to be launched
   * @param instanceName A unique name for the connection.  If not specified, a default name
   * will be used.
   */
  static forRoot(
    options?: PuppeteerModuleOptions['launchOptions'] & { isGlobal?: boolean },
    instanceName?: string,
  ): DynamicModule {
    return {
      module: PuppeteerModule,
      global: options?.isGlobal,
      imports: [PuppeteerCoreModule.forRoot(options, instanceName)],
    };
  }

  /**
   * Inject the Puppeteer asynchronously, allowing any dependencies such as a configuration
   * service to be injected first.
   * @param options Options for asynchronous injection
   */
  static forRootAsync(options: PuppeteerModuleAsyncOptions): DynamicModule {
    return {
      module: PuppeteerModule,
      global: options.isGlobal,
      imports: [PuppeteerCoreModule.forRootAsync(options)],
    };
  }

  /**
   * Inject Pages.
   * @param pages An array of the names of the pages to be injected.
   * @param instanceName A unique name for the connection. If not specified, a default name
   * will be used.
   */
  static forFeature(
    pages: string[] = [],
    instanceName?: string,
  ): DynamicModule {
    const providers = createPuppeteerProviders(instanceName, pages);
    return {
      module: PuppeteerModule,
      providers: providers,
      exports: providers,
    };
  }
}
