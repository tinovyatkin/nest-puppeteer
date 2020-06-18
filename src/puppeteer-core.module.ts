import {
  Module,
  Inject,
  Global,
  DynamicModule,
  Provider,
} from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { LaunchOptions } from 'puppeteer';
import puppeteer from 'puppeteer';
import {
  PUPPETEER_INSTANCE_NAME,
  DEFAULT_PUPPETEER_INSTANCE_NAME,
  DEFAULT_CHROME_LAUNCH_OPTIONS,
  PUPPETEER_MODULE_OPTIONS,
} from './puppeteer.constants';
import {
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
export class PuppeteerCoreModule {
  constructor(
    @Inject(PUPPETEER_INSTANCE_NAME) private readonly instanceName: string,
    private readonly moduleRef: ModuleRef,
  ) {}

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
      useFactory: async () => {
        return await puppeteer.launch(launchOptions);
      },
    };

    const contextProvider = {
      provide: getContextToken(instanceName),
      useFactory: async (browser: puppeteer.Browser, incognito = true) => {
        if (incognito) return await browser.createIncognitoBrowserContext();
        return browser.defaultBrowserContext();
      },
      inject: [getBrowserToken(instanceName)],
    };

    const pageProvider = {
      provide: getPageToken(instanceName),
      useFactory: async (context: puppeteer.BrowserContext) =>
        await context.newPage(),
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
      useFactory: async (puppeteerModuleOptions: PuppeteerModuleOptions) => {
        return await puppeteer.launch(
          puppeteerModuleOptions.launchOptions ?? DEFAULT_CHROME_LAUNCH_OPTIONS,
        );
      },
      inject: [PUPPETEER_MODULE_OPTIONS],
    };

    const contextProvider = {
      provide: getContextToken(puppeteerInstanceName),
      useFactory: async (browser: puppeteer.Browser, incognito = true) => {
        if (incognito) return await browser.createIncognitoBrowserContext();
        return browser.defaultBrowserContext();
      },
      inject: [
        PUPPETEER_MODULE_OPTIONS,
        getBrowserToken(puppeteerInstanceName),
      ],
    };

    const pageProvider = {
      provide: getPageToken(puppeteerInstanceName),
      useFactory: async (context: puppeteer.BrowserContext) =>
        await context.newPage(),
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
    const browser: puppeteer.Browser = this.moduleRef.get(
      getBrowserToken(this.instanceName),
    );

    if (browser && browser.isConnected()) await browser.close();
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
        useFactory: async (optionsFactory: PuppeteerOptionsFactory) =>
          await optionsFactory.createPuppeteerOptions(),
        inject: [options.useExisting],
      };
    } else if (options.useClass) {
      return {
        provide: PUPPETEER_MODULE_OPTIONS,
        useFactory: async (optionsFactory: PuppeteerOptionsFactory) =>
          await optionsFactory.createPuppeteerOptions(),
        inject: [options.useClass],
      };
    } else {
      throw new Error('Invalid PuppeteerModule options');
    }
  }
}
