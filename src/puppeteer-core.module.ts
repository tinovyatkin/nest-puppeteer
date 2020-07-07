import {
  Module,
  Inject,
  Global,
  DynamicModule,
  Provider,
  OnApplicationShutdown,
  OnModuleDestroy,
} from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import type { LaunchOptions, Browser, BrowserContext } from 'puppeteer';
import { launch } from 'puppeteer';
import {
  PUPPETEER_INSTANCE_NAME,
  DEFAULT_PUPPETEER_INSTANCE_NAME,
  DEFAULT_CHROME_LAUNCH_OPTIONS,
  PUPPETEER_MODULE_OPTIONS,
} from './puppeteer.constants';
import type {
  PuppeteerModuleAsyncOptions,
  PuppeteerOptionsFactory,
  PuppeteerModuleOptions,
} from './interfaces/puppeteer-options.interface';
import {
  getBrowserToken,
  getContextToken,
  getPageToken,
} from './puppeteer.util';

@Global()
@Module({})
export class PuppeteerCoreModule
  implements OnApplicationShutdown, OnModuleDestroy {
  constructor(
    @Inject(PUPPETEER_INSTANCE_NAME) private readonly instanceName: string,
    private readonly moduleRef: ModuleRef,
  ) {}
  onApplicationShutdown() {
    return this.onModuleDestroy();
  }

  static forRoot(
    launchOptions: LaunchOptions = DEFAULT_CHROME_LAUNCH_OPTIONS,
    instanceName: string = DEFAULT_PUPPETEER_INSTANCE_NAME,
  ): DynamicModule {
    const instanceNameProvider = {
      provide: PUPPETEER_INSTANCE_NAME,
      useValue: instanceName,
    };

    const browserProvider = {
      provide: getBrowserToken(instanceName),
      async useFactory() {
        return await launch(launchOptions);
      },
    };

    const contextProvider = {
      provide: getContextToken(instanceName),
      async useFactory(browser: Browser) {
        return browser.createIncognitoBrowserContext();
      },
      inject: [getBrowserToken(instanceName)],
    };

    const pageProvider = {
      provide: getPageToken(instanceName),
      async useFactory(context: BrowserContext) {
        return await context.newPage();
      },
      inject: [getContextToken(instanceName)],
    };

    return {
      module: PuppeteerCoreModule,
      providers: [
        instanceNameProvider,
        browserProvider,
        contextProvider,
        pageProvider,
      ],
      exports: [browserProvider, contextProvider, pageProvider],
    };
  }

  static forRootAsync(options: PuppeteerModuleAsyncOptions): DynamicModule {
    const puppeteerInstanceName =
      options.instanceName ?? DEFAULT_PUPPETEER_INSTANCE_NAME;

    const instanceNameProvider = {
      provide: PUPPETEER_INSTANCE_NAME,
      useValue: puppeteerInstanceName,
    };

    const browserProvider = {
      provide: getBrowserToken(puppeteerInstanceName),
      async useFactory(puppeteerModuleOptions: PuppeteerModuleOptions) {
        return await launch(
          puppeteerModuleOptions.launchOptions ?? DEFAULT_CHROME_LAUNCH_OPTIONS,
        );
      },
      inject: [PUPPETEER_MODULE_OPTIONS],
    };

    const contextProvider = {
      provide: getContextToken(puppeteerInstanceName),
      async useFactory(browser: Browser) {
        return await browser.createIncognitoBrowserContext();
      },
      inject: [
        PUPPETEER_MODULE_OPTIONS,
        getBrowserToken(puppeteerInstanceName),
      ],
    };

    const pageProvider = {
      provide: getPageToken(puppeteerInstanceName),
      async useFactory(context: BrowserContext) {
        return await context.newPage();
      },
      inject: [
        PUPPETEER_MODULE_OPTIONS,
        getContextToken(puppeteerInstanceName),
      ],
    };

    const asyncProviders = this.createAsyncProviders(options);

    return {
      module: PuppeteerCoreModule,
      imports: options.imports,
      providers: [
        ...asyncProviders,
        browserProvider,
        contextProvider,
        pageProvider,
        instanceNameProvider,
      ],
      exports: [browserProvider, contextProvider, pageProvider],
    };
  }

  async onModuleDestroy() {
    const browser: Browser = this.moduleRef.get(
      getBrowserToken(this.instanceName),
    );

    if (browser?.isConnected()) await browser.close();
  }

  private static createAsyncProviders(
    options: PuppeteerModuleAsyncOptions,
  ): Provider[] {
    if (options.useExisting || options.useFactory) {
      return [this.createAsyncOptionsProvider(options)];
    } else if (options.useClass) {
      return [
        this.createAsyncOptionsProvider(options),
        {
          provide: options.useClass,
          useClass: options.useClass,
        },
      ];
    } else {
      return [];
    }
  }

  private static createAsyncOptionsProvider(
    options: PuppeteerModuleAsyncOptions,
  ): Provider {
    if (options.useFactory) {
      return {
        provide: PUPPETEER_MODULE_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject ?? [],
      };
    } else if (options.useExisting) {
      return {
        provide: PUPPETEER_MODULE_OPTIONS,
        async useFactory(optionsFactory: PuppeteerOptionsFactory) {
          return optionsFactory.createPuppeteerOptions();
        },
        inject: [options.useExisting],
      };
    } else if (options.useClass) {
      return {
        provide: PUPPETEER_MODULE_OPTIONS,
        async useFactory(optionsFactory: PuppeteerOptionsFactory) {
          return optionsFactory.createPuppeteerOptions();
        },
        inject: [options.useClass],
      };
    } else {
      throw new Error('Invalid PuppeteerModule options');
    }
  }
}
