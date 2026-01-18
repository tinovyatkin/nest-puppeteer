import type { ModuleMetadata, Type, InjectionToken } from "@nestjs/common";
import type { LaunchOptions } from "puppeteer";

/**
 * Options that ultimately need to be provided to create a Puppeteer instance
 */
export interface PuppeteerModuleOptions {
  instanceName?: string;

  launchOptions?: LaunchOptions;
}

export interface PuppeteerOptionsFactory {
  createPuppeteerOptions(): Promise<PuppeteerModuleOptions> | PuppeteerModuleOptions;
}

/**
 * Options available when creating the module asynchronously.  You should use only one of the
 * useExisting, useClass, or useFactory options for creation.
 */
export interface PuppeteerModuleAsyncOptions extends Pick<ModuleMetadata, "imports"> {
  /** A unique name for the instance.  If not specified, a default one will be used. */
  instanceName?: string;

  /**
   * If "true", registers `PuppeteerModule` as a global module.
   * See: https://docs.nestjs.com/modules#global-modules
   */
  isGlobal?: boolean;

  /** Reuse an injectable factory class created in another module. */
  useExisting?: Type<PuppeteerOptionsFactory>;

  /**
   * Use an injectable factory class to populate the module options, such as URI and database name.
   */
  useClass?: Type<PuppeteerOptionsFactory>;

  /**
   * A factory function that will populate the module options, such as URI and database name.
   */
  useFactory?: (...args: unknown[]) => Promise<PuppeteerModuleOptions> | PuppeteerModuleOptions;

  /**
   * Inject any dependencies required by the Puppeteer module, such as a configuration service
   * that supplies the options and instance name
   */
  inject?: InjectionToken[];
}
