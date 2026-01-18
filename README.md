# nest-puppeteer [![codecov](https://codecov.io/gh/tinovyatkin/nest-puppeteer/branch/master/graph/badge.svg)](https://codecov.io/gh/tinovyatkin/nest-puppeteer)

## Description

A [NestJS](https://nestjs.com/) module that provides dependency injection for [Puppeteer](https://github.com/puppeteer/puppeteer), with support for
sync/async configuration and named instances.

## Installation

`puppeteer` is a peer dependency, so install it alongside `nest-puppeteer`:

```sh
npm install nest-puppeteer puppeteer
```

## Usage

The API follows standard NestJS dynamic module patterns. If you’re new to Nest DI, see the
[custom providers](https://docs.nestjs.com/fundamentals/custom-providers) docs.

### Quick start

Register the module once (usually in `AppModule`). Use `isGlobal: true` if you want to inject Puppeteer in feature modules without re-importing.

```ts
import { Module } from "@nestjs/common";
import { PuppeteerModule } from "nest-puppeteer";

@Module({
  imports: [
    PuppeteerModule.forRoot({
      isGlobal: true,
      // Any puppeteer.launch() options (optional)
      // args, headless, executablePath, etc.
    }),
  ],
})
export class AppModule {}
```

### Injecting Browser / Context / Page

This module provides three injectable singletons per instance: `Browser`, `BrowserContext` (created via `browser.createBrowserContext()`), and a
single `Page` created from that context.

```ts
import { Injectable } from "@nestjs/common";
import type { Browser, BrowserContext, Page } from "puppeteer";
import { InjectBrowser, InjectContext, InjectPage } from "nest-puppeteer";

@Injectable()
export class CrawlerService {
  constructor(
    @InjectBrowser() private readonly browser: Browser,
    @InjectContext() private readonly context: BrowserContext,
    @InjectPage() private readonly page: Page,
  ) {}

  async crawl(url: string) {
    await this.page.goto(url, { waitUntil: "networkidle2" });
    return this.page.content();
  }

  async crawlIsolated(url: string) {
    const context = await this.browser.createBrowserContext();
    const page = await context.newPage();
    try {
      await page.goto(url, { waitUntil: "networkidle2" });
      return await page.content();
    } finally {
      await context.close();
    }
  }
}
```

### Named instances

If you need multiple browsers (e.g., different `executablePath` or profiles), pass an `instanceName` as the second argument to `forRoot` and to the
`@Inject*()` decorators:

```ts
import { Module } from "@nestjs/common";
import { PuppeteerModule } from "nest-puppeteer";

@Module({
  imports: [
    PuppeteerModule.forRoot({ isGlobal: true }, "primary"),
    PuppeteerModule.forRoot(
      {
        executablePath: "/path/to/chrome",
      },
      "secondary",
    ),
  ],
})
export class AppModule {}
```

```ts
import { Injectable } from "@nestjs/common";
import type { Browser } from "puppeteer";
import { InjectBrowser } from "nest-puppeteer";

@Injectable()
export class BrowserService {
  constructor(@InjectBrowser("secondary") private readonly browser: Browser) {}
}
```

### Launch arguments & defaults

When you provide custom `args` in your launch options, they are **merged** with the default arguments rather than replacing them. This ensures you
don't accidentally lose important defaults (e.g., `--no-sandbox` on Linux).

```ts
import { Module } from "@nestjs/common";
import { PuppeteerModule } from "nest-puppeteer";

@Module({
  imports: [
    PuppeteerModule.forRoot({
      // Your custom args are added to the defaults
      args: ["--app", "--disable-gpu", "--window-size=800,600"],
    }),
  ],
})
export class AppModule {}
```

Default arguments include:

- `--allow-insecure-localhost`
- `--allow-http-screen-capture`
- `--no-zygote`
- `--no-sandbox` (Linux only)
- `--disable-blink-features=AutomationControlled` (removes automation detection flag)

#### A note on `--no-sandbox`

On Linux, we add `--no-sandbox` by default for compatibility with common environments. However, Puppeteer strongly recommends running Chrome with
sandboxing enabled for security. To disable our default and run with proper sandboxing:

```ts
PuppeteerModule.forRoot({
  ignoreDefaultArgs: ["--no-sandbox", "--no-zygote"],
});
```

See the [Puppeteer troubleshooting guide](https://pptr.dev/troubleshooting#setting-up-chrome-linux-sandbox) for Linux sandbox setup.

#### Headless modes

Chrome 112+ offers [two headless modes](https://developer.chrome.com/docs/chromium/headless):

- `headless: true` — New unified headless mode (default)
- `headless: 'shell'` — Legacy headless mode (chrome-headless-shell)
- `headless: false` — Visible browser with UI

```ts
PuppeteerModule.forRoot({
  headless: "shell", // Use legacy headless for compatibility
});
```

#### Automation detection

This module adds `--disable-blink-features=AutomationControlled` to the default launch arguments, which removes the `navigator.webdriver` flag — one
of the most common automation indicators. This does not make automation “undetectable”; adjust your strategy based on the target.

If you need additional evasions (e.g., WebGL vendor spoofing), you can inject custom scripts via `page.evaluateOnNewDocument()`:

```ts
import { Injectable } from "@nestjs/common";
import type { Page } from "puppeteer";
import { InjectPage } from "nest-puppeteer";

@Injectable()
export class CrawlerService {
  constructor(@InjectPage() private readonly page: Page) {}

  async onModuleInit() {
    // Optional: Override WebGL fingerprint
    await this.page.evaluateOnNewDocument(() => {
      const getParameterProxy = new Proxy(
        WebGLRenderingContext.prototype.getParameter,
        {
          apply(target, thisArg, args) {
            if (args[0] === 37445) return "Intel Inc."; // UNMASKED_VENDOR_WEBGL
            if (args[0] === 37446) return "Intel Iris OpenGL Engine"; // UNMASKED_RENDERER_WEBGL
            return Reflect.apply(target, thisArg, args);
          },
        },
      );
      WebGLRenderingContext.prototype.getParameter = getParameterProxy;
      WebGL2RenderingContext.prototype.getParameter = getParameterProxy;
    });
  }
}
```

If you need access to the default options for reference or custom merging, you can import them:

```ts
import { DEFAULT_CHROME_LAUNCH_OPTIONS } from "nest-puppeteer";

console.log(DEFAULT_CHROME_LAUNCH_OPTIONS.args);
```

### Asynchronous configuration

If you want to pass in Puppeteer configuration options from a ConfigService or other provider, you'll need to perform the Puppeteer module
configuration asynchronously, using `PuppeteerModule.forRootAsync()`. There are several different ways of doing this.

#### Use a factory function

The first is to specify a factory function that populates the options:

```ts
import { Module } from "@nestjs/common";
import { PuppeteerModule } from "nest-puppeteer";
import { ConfigModule, ConfigService } from "@nestjs/config";

@Module({
  imports: [
    PuppeteerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        launchOptions: config.get("PUPPETEER_LAUNCH_OPTIONS"),
      }),
      inject: [ConfigService],
      isGlobal: true,
    }),
  ],
})
export class AppModule {}
```

#### Use a class

Alternatively, you can write a class that implements the `PuppeteerOptionsFactory` interface and use that to create the options:

```ts
import { Injectable, Module } from "@nestjs/common";
import {
  PuppeteerModule,
  PuppeteerOptionsFactory,
  PuppeteerModuleOptions,
} from "nest-puppeteer";

@Injectable()
export class PuppeteerConfigService implements PuppeteerOptionsFactory {
  createPuppeteerOptions(): PuppeteerModuleOptions {
    return {
      launchOptions: {
        // Any puppeteer.launch() options here
        args: ["--window-size=1280,720"],
      },
    };
  }
}

@Module({
  imports: [
    PuppeteerModule.forRootAsync({
      useClass: PuppeteerConfigService,
      isGlobal: true,
    }),
  ],
})
export class AppModule {}
```

Just be aware that the `useClass` option will instantiate your class inside the PuppeteerModule, which may not be what you want.

#### Use existing

If you wish to instead import your PuppeteerConfigService class from a different module, the `useExisting` option will allow you to do that.

```ts
import { Module } from "@nestjs/common";
import { PuppeteerModule } from "nest-puppeteer";
import { ConfigModule } from "./config.module";
import { PuppeteerConfigService } from "./puppeteer-config.service";

@Module({
  imports: [
    PuppeteerModule.forRootAsync({
      imports: [ConfigModule],
      useExisting: PuppeteerConfigService,
      isGlobal: true,
    }),
  ],
})
export class AppModule {}
```

In this example, `PuppeteerConfigService` is provided by `ConfigModule` and implements `PuppeteerOptionsFactory`.

## Testing

When writing unit tests for controllers or services that inject Puppeteer dependencies, you can use the `createMockPuppeteerProviders()` helper to
easily create mock providers with the correct injection tokens.

```ts
import { Test } from "@nestjs/testing";
import { createMockPuppeteerProviders } from "nest-puppeteer";
import { CrawlerService } from "./crawler.service";

describe("CrawlerService", () => {
  let service: CrawlerService;
  let mockPage: { goto: jest.Mock; content: jest.Mock };

  beforeEach(async () => {
    mockPage = {
      goto: jest.fn().mockResolvedValue(null),
      content: jest.fn().mockResolvedValue("<html>test</html>"),
    };

    const module = await Test.createTestingModule({
      providers: [
        CrawlerService,
        ...createMockPuppeteerProviders({
          page: mockPage,
        }),
      ],
    }).compile();

    service = module.get(CrawlerService);
  });

  it("should crawl a page", async () => {
    const result = await service.crawl("https://example.com");

    expect(mockPage.goto).toHaveBeenCalledWith(
      "https://example.com",
      expect.anything(),
    );
    expect(result.content).toBe("<html>test</html>");
  });
});
```

The `createMockPuppeteerProviders()` function accepts the following options:

| Option         | Description                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------------- |
| `instanceName` | The unique name for the Puppeteer instance (must match the name used in `forRoot`/`forRootAsync`) |
| `browser`      | Mock value for the Browser                                                                        |
| `context`      | Mock value for the BrowserContext                                                                 |
| `page`         | Mock value for the Page                                                                           |

For named instances:

```ts
createMockPuppeteerProviders({
  instanceName: "secondary",
  page: mockPage,
});
```

## Stay in touch

- Author - Konstantin Vyatkin <tino@vtkn.io>

## License

`nest-puppeteer` is [MIT licensed](LICENSE).
