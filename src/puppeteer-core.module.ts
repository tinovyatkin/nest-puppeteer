import { DynamicModule, Provider, OnApplicationShutdown, OnModuleDestroy } from "@nestjs/common";
import { Module, Inject, Global, Logger } from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";
import { Browser, BrowserContext, LaunchOptions } from "puppeteer";
import puppeteer from "puppeteer";

import {
  PuppeteerModuleAsyncOptions,
  PuppeteerOptionsFactory,
  PuppeteerModuleOptions,
} from "./interfaces/puppeteer-options.interface.js";
import {
  PUPPETEER_INSTANCE_NAME,
  DEFAULT_PUPPETEER_INSTANCE_NAME,
  DEFAULT_CHROME_LAUNCH_OPTIONS,
  PUPPETEER_MODULE_OPTIONS,
} from "./puppeteer.constants.js";
import { getBrowserToken, getContextToken, getPageToken } from "./puppeteer.util.js";

/**
 * Merges user-provided launch options with defaults.
 * User-provided args are appended to default args (de-duplicated).
 * Respects Puppeteer's ignoreDefaultArgs option:
 * - If true: skip default args entirely
 * - If string[]: filter those specific args from defaults
 * - Otherwise: merge as normal
 */
function mergeLaunchOptions(userOptions?: LaunchOptions): LaunchOptions {
  if (!userOptions) {
    return DEFAULT_CHROME_LAUNCH_OPTIONS;
  }

  const { args: userArgs, ignoreDefaultArgs, ...restUserOptions } = userOptions;
  const defaultArgs = DEFAULT_CHROME_LAUNCH_OPTIONS.args ?? [];

  let mergedArgs: string[];
  if (ignoreDefaultArgs === true) {
    mergedArgs = userArgs ?? [];
  } else if (Array.isArray(ignoreDefaultArgs)) {
    const filteredDefaults = defaultArgs.filter((arg) => !ignoreDefaultArgs.includes(arg));
    mergedArgs = userArgs ? [...new Set([...filteredDefaults, ...userArgs])] : filteredDefaults;
  } else {
    mergedArgs = userArgs ? [...new Set([...defaultArgs, ...userArgs])] : defaultArgs;
  }

  return {
    ...DEFAULT_CHROME_LAUNCH_OPTIONS,
    ...restUserOptions,
    args: mergedArgs,
  };
}

@Global()
@Module({})
export class PuppeteerCoreModule implements OnApplicationShutdown, OnModuleDestroy {
  private readonly logger = new Logger("PuppeteerModule");

  constructor(
    @Inject(PUPPETEER_INSTANCE_NAME) private readonly instanceName: string,
    private readonly moduleRef: ModuleRef,
  ) {}
  onApplicationShutdown() {
    return this.onModuleDestroy();
  }

  static forRoot(
    launchOptions?: LaunchOptions,
    instanceName: string = DEFAULT_PUPPETEER_INSTANCE_NAME,
  ): DynamicModule {
    const mergedLaunchOptions = mergeLaunchOptions(launchOptions);

    const instanceNameProvider = {
      provide: PUPPETEER_INSTANCE_NAME,
      useValue: instanceName,
    };

    const browserProvider = {
      provide: getBrowserToken(instanceName),
      async useFactory() {
        return await puppeteer.launch(mergedLaunchOptions);
      },
    };

    const contextProvider = {
      provide: getContextToken(instanceName),
      async useFactory(browser: Browser) {
        return browser.createBrowserContext();
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
      providers: [instanceNameProvider, browserProvider, contextProvider, pageProvider],
      exports: [browserProvider, contextProvider, pageProvider],
    };
  }

  static forRootAsync(options: PuppeteerModuleAsyncOptions): DynamicModule {
    const puppeteerInstanceName = options.instanceName ?? DEFAULT_PUPPETEER_INSTANCE_NAME;

    const instanceNameProvider = {
      provide: PUPPETEER_INSTANCE_NAME,
      useValue: puppeteerInstanceName,
    };

    const browserProvider = {
      provide: getBrowserToken(puppeteerInstanceName),
      async useFactory(puppeteerModuleOptions: PuppeteerModuleOptions) {
        return await puppeteer.launch(mergeLaunchOptions(puppeteerModuleOptions.launchOptions));
      },
      inject: [PUPPETEER_MODULE_OPTIONS],
    };

    const contextProvider = {
      provide: getContextToken(puppeteerInstanceName),
      async useFactory(browser: Browser) {
        return await browser.createBrowserContext();
      },
      inject: [getBrowserToken(puppeteerInstanceName)],
    };

    const pageProvider = {
      provide: getPageToken(puppeteerInstanceName),
      async useFactory(context: BrowserContext) {
        return await context.newPage();
      },
      inject: [getContextToken(puppeteerInstanceName)],
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
    const browser: Browser = this.moduleRef.get(getBrowserToken(this.instanceName));

    try {
      if (browser?.connected) {
        this.logger.log("Closing browser...");
        await browser.close();
      }
    } catch (error) {
      this.logger.error(
        `Failed to close browser: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  private static createAsyncProviders(options: PuppeteerModuleAsyncOptions): Provider[] {
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

  private static createAsyncOptionsProvider(options: PuppeteerModuleAsyncOptions): Provider {
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
      throw new Error("Invalid PuppeteerModule options");
    }
  }
}
