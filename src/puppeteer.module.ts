import { Module, DynamicModule } from "@nestjs/common";
import { createPuppeteerProviders } from "./puppeteer.providers.js";
import { PuppeteerCoreModule } from "./puppeteer-core.module.js";
import type {
  PuppeteerModuleAsyncOptions,
  PuppeteerModuleOptions,
} from "./interfaces/puppeteer-options.interface.js";

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
    options?: PuppeteerModuleOptions["launchOptions"] & { isGlobal?: boolean },
    instanceName?: string,
  ): DynamicModule {
    const { isGlobal, ...launchOptions } = options ?? {};
    return {
      module: PuppeteerModule,
      global: isGlobal,
      imports: [PuppeteerCoreModule.forRoot(launchOptions, instanceName)],
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
  static forFeature(pages: string[] = [], instanceName?: string): DynamicModule {
    const providers = createPuppeteerProviders(instanceName, pages);
    return {
      module: PuppeteerModule,
      providers,
      exports: providers,
    };
  }
}
