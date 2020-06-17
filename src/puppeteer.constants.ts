import { LaunchOptions } from 'puppeteer';

export const MONGO_CONNECTION_NAME = 'MongoConnectionName';
export const MONGO_MODULE_OPTIONS = 'MongoModuleOptions';

export const DEFAULT_MONGO_CONNECTION_NAME = 'DefaultMongo';
export const DEFAULT_CHROME_LAUNCH_OPTIONS: LaunchOptions = {
  headless: true,
};
