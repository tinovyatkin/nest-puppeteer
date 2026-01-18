# nest-puppeteer [![codecov](https://codecov.io/gh/tinovyatkin/nest-puppeteer/branch/master/graph/badge.svg)](https://codecov.io/gh/tinovyatkin/nest-puppeteer)

## Description

This is a Puppeteer module for [NestJS](https://nestjs.com/), making it easy to inject the [Puppeteer](https://github.com/puppeteer/puppeteer) into your project. It's modeled after the official modules, allowing for asynchronous configuration and such.

## Installation

In your existing NestJS-based project:

```sh
npm install nest-puppeteer puppeteer
npm install -D @types/puppeteer
```

## Usage

Overall, it works very similarly to any injectable module described in the NestJS documentation. You may want to refer to those docs as well -- and maybe the [dependency injection](https://docs.nestjs.com/fundamentals/custom-providers) docs too if you're still trying to wrap your head around the NestJS implementation of it.

### Simple example

In the simplest case, you can explicitly specify options you'd normally provide to your `puppeteer.launch` or the instance name using `PuppeteerModule.forRoot()`:

```typescript
import { Module } from '@nestjs/common';
import { PuppeteerModule } from 'nest-puppeteer';

@Module({
  imports: [
    PuppeteerModule.forRoot(
      { pipe: true }, // optional, any Puppeteer launch options here or leave empty for good defaults */,
      'BrowserInstanceName', // optional, can be useful for using Chrome and Firefox in the same project
    ),
  ],
})
export class CatsModule {}
```

### Chrome launch arguments

When you provide custom `args` in your launch options, they are **merged** with the default arguments rather than replacing them. This ensures you don't accidentally lose important defaults like `--no-sandbox` on Linux.

```typescript
import { Module } from '@nestjs/common';
import { PuppeteerModule } from 'nest-puppeteer';

@Module({
  imports: [
    PuppeteerModule.forRoot({
      // Your custom args are added to the defaults
      args: ['--app', '--disable-gpu', '--window-size=800,600'],
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

#### A note on `--no-sandbox`

On Linux, we add `--no-sandbox` by default for compatibility with common environments. However, Puppeteer strongly recommends running Chrome with sandboxing enabled for security. To disable our default and run with proper sandboxing:

```typescript
PuppeteerModule.forRoot({
  ignoreDefaultArgs: ['--no-sandbox', '--no-zygote'],
})
```

See the [Puppeteer troubleshooting guide](https://pptr.dev/troubleshooting#setting-up-chrome-linux-sandbox) for instructions on configuring Chrome sandboxing on Linux.

If you need access to the default options for reference or custom merging, you can import them:

```typescript
import { DEFAULT_CHROME_LAUNCH_OPTIONS } from 'nest-puppeteer';

console.log(DEFAULT_CHROME_LAUNCH_OPTIONS.args);
```

To inject the Puppeteer `Browser` object:

```typescript
import type { Browser } from 'puppeteer';
import { Injectable } from '@nestjs/common';
import { InjectBrowser } from 'nest-puppeteer';
import { Cat } from './interfaces/cat';

@Injectable()
export class CatsRepository {
  constructor(@InjectBrowser() private readonly browser: Browser) {}

  async create(cat: Cat) {
    const version = await this.browser.version();
    return { version };
  }
}
```

To inject a new incognito `BrowserContext` object:

```typescript
import { Module } from '@nestjs/common';
import { PuppeteerModule } from 'nest-puppeteer';
import { CatsController } from './cats.controller';
import { CatsService } from './cats.service';

@Module({
  imports: [PuppeteerModule.forFeature()],
  controllers: [CatsController],
  providers: [CatsService],
})
export class CatsModule {}
```

```typescript
import type { BrowserContext } from 'puppeteer';
import { Injectable } from '@nestjs/common';
import { InjectContext } from 'nest-puppeteer';
import { Cat } from './interfaces/cat';

@Injectable()
export class CatsRepository {
  constructor(
    @InjectContext() private readonly browserContext: BrowserContext,
  ) {}

  async create(cat: Cat) {
    const page = await this.browserContext.newPage();
    await page.goto('https://test.com/');
    return await page.content();
  }
}
```

Inject `Page` object:

```typescript
import { Injectable } from '@nestjs/common';
import { InjectPage } from 'nest-puppeteer';
import type { Page } from 'puppeteer';

@Injectable()
export class CrawlerService {
  constructor(@InjectPage() private readonly page: Page) {}

  async crawl(url: string) {
    await this.page.goto(url, { waitUntil: 'networkidle2' });
    const content = await this.page.content();
    return { content };
  }
}
```

### Asynchronous configuration

If you want to pass in Puppeteer configuration options from a ConfigService or other provider, you'll need to perform the Puppeteer module configuration asynchronously, using `PuppeteerModule.forRootAsync()`. There are several different ways of doing this.

#### Use a factory function

The first is to specify a factory function that populates the options:

```typescript
import { Module } from '@nestjs/common'
import { PuppeteerModule } from 'nest-puppeteer'
import { ConfigService } from '../config/config.service'

@Module({
    imports: [PuppeteerModule.forRootAsync({
        imports: [ConfigModule],
        useFactory: (config: ConfigService) => {
            launchOptions: config.chromeLaunchOptions,
        },
        inject: [ConfigService]
    })]
})
export class CatsModule {}
```

#### Use a class

Alternatively, you can write a class that implements the `PuppeteerOptionsFactory` interface and use that to create the options:

```typescript
import { Module } from '@nestjs/common';
import {
  PuppeteerModule,
  PuppeteerOptionsFactory,
  PuppeteerModuleOptions,
} from 'nest-puppeteer';

@Injectable()
export class PuppeteerConfigService implements PuppeteerOptionsFactory {
  private readonly launchOptions = { pipe: true };
  private readonly dbName = 'BestAppEver';

  createMongoOptions(): PuppeteerModuleOptions {
    return {
      launchOptions: this.launchOptions,
      instanceName: this.instanceName,
    };
  }
}

@Module({
  imports: [
    PuppeteerModule.forRootAsync({
      useClass: PuppeteerConfigService,
    }),
  ],
})
export class CatsModule {}
```

Just be aware that the `useClass` option will instantiate your class inside the PuppeteerModule, which may not be what you want.

#### Use existing

If you wish to instead import your PuppeteerConfigService class from a different module, the `useExisting` option will allow you to do that.

```typescript
import { Module } from '@nestjs/common'
import { PuppeteerModule } from 'nest-puppeteer'
import { ConfigModule, ConfigService } from '../config/config.service'

@Module({
    imports: [PuppeteerModule.forRootAsync({
        imports: [ConfigModule]
        useExisting: ConfigService
    })]
})
export class CatsModule {}
```

In this example, we're assuming that `ConfigService` implements the `PuppeteerOptionsFactory` interface and can be found in the ConfigModule.

#### Use module globally

When you want to use `PuppeteerModule` in other modules, you'll need to import it (as is standard with any Nest module). Alternatively, declare it as a [global module](https://docs.nestjs.com/modules#global-modules) by setting the options object's `isGlobal` property to `true`, as shown below. In that case, you will not need to import `PuppeteerModule` in other modules once it's been loaded in the root module (e.g., `AppModule`).

```typescript
PuppeteerModule.forRoot({
  isGlobal: true,
});
```

## Testing

When writing unit tests for controllers or services that inject Puppeteer dependencies, you can use the `createMockPuppeteerProviders()` helper to easily create mock providers with the correct injection tokens.

```typescript
import { Test } from '@nestjs/testing';
import { createMockPuppeteerProviders } from 'nest-puppeteer';
import { CrawlerService } from './crawler.service';

describe('CrawlerService', () => {
  let service: CrawlerService;
  let mockPage: { goto: jest.Mock; content: jest.Mock };

  beforeEach(async () => {
    mockPage = {
      goto: jest.fn().mockResolvedValue(null),
      content: jest.fn().mockResolvedValue('<html>test</html>'),
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

  it('should crawl a page', async () => {
    const result = await service.crawl('https://example.com');

    expect(mockPage.goto).toHaveBeenCalledWith('https://example.com', expect.anything());
    expect(result.content).toBe('<html>test</html>');
  });
});
```

The `createMockPuppeteerProviders()` function accepts the following options:

| Option | Description |
|--------|-------------|
| `instanceName` | The unique name for the Puppeteer instance (must match the name used in `forRoot`/`forRootAsync`) |
| `browser` | Mock value for the Browser |
| `context` | Mock value for the BrowserContext |
| `page` | Mock value for the Page |

For named instances:

```typescript
createMockPuppeteerProviders({
  instanceName: 'secondary',
  page: mockPage,
});
```

## Stay in touch

- Author - [Konstantin Vyatkin](tino@vtkn.io)

## License

`nest-puppeteer` is [MIT licensed](LICENSE).
