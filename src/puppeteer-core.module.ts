import {
  Module,
  Inject,
  Global,
  DynamicModule,
  Provider,
  Type,
} from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { MongoClient, MongoClientOptions } from 'mongodb';
import {
  MONGO_CONNECTION_NAME,
  DEFAULT_MONGO_CONNECTION_NAME,
  DEFAULT_MONGO_CLIENT_OPTIONS,
  MONGO_MODULE_OPTIONS,
} from './mongo.constants';
import {
  MongoModuleAsyncOptions,
  MongoOptionsFactory,
  MongoModuleOptions,
} from './interfaces/mongo-options.interface';
import { getClientToken, getDbToken } from './mongo.util';

@Global()
@Module({})
export class MongoCoreModule {
  constructor(
    @Inject(MONGO_CONNECTION_NAME) private readonly connectionName: string,
    private readonly moduleRef: ModuleRef,
  ) {}

  static forRoot(
    uri: string,
    dbName: string,
    clientOptions: MongoClientOptions = DEFAULT_MONGO_CLIENT_OPTIONS,
    connectionName: string = DEFAULT_MONGO_CONNECTION_NAME,
  ): DynamicModule {
    const connectionNameProvider = {
      provide: MONGO_CONNECTION_NAME,
      useValue: connectionName,
    };

    const clientProvider = {
      provide: getClientToken(connectionName),
      useFactory: async () => {
        const client = new MongoClient(uri, clientOptions);
        return await client.connect();
      },
    };

    const dbProvider = {
      provide: getDbToken(connectionName),
      useFactory: (client: MongoClient) => client.db(dbName),
      inject: [getClientToken(connectionName)],
    };

    return {
      module: MongoCoreModule,
      providers: [connectionNameProvider, clientProvider, dbProvider],
      exports: [clientProvider, dbProvider],
    };
  }

  static forRootAsync(options: MongoModuleAsyncOptions): DynamicModule {
    const mongoConnectionName =
      options.connectionName ?? DEFAULT_MONGO_CONNECTION_NAME;

    const connectionNameProvider = {
      provide: MONGO_CONNECTION_NAME,
      useValue: mongoConnectionName,
    };

    const clientProvider = {
      provide: getClientToken(mongoConnectionName),
      useFactory: async (mongoModuleOptions: MongoModuleOptions) => {
        const { uri, clientOptions } = mongoModuleOptions;
        const client = new MongoClient(
          uri,
          clientOptions ?? DEFAULT_MONGO_CLIENT_OPTIONS,
        );
        return await client.connect();
      },
      inject: [MONGO_MODULE_OPTIONS],
    };

    const dbProvider = {
      provide: getDbToken(mongoConnectionName),
      useFactory: (
        mongoModuleOptions: MongoModuleOptions,
        client: MongoClient,
      ) => client.db(mongoModuleOptions.dbName),
      inject: [MONGO_MODULE_OPTIONS, getClientToken(mongoConnectionName)],
    };

    const asyncProviders = this.createAsyncProviders(options);

    return {
      module: MongoCoreModule,
      imports: options.imports,
      providers: [
        ...asyncProviders,
        clientProvider,
        dbProvider,
        connectionNameProvider,
      ],
      exports: [clientProvider, dbProvider],
    };
  }

  async onModuleDestroy() {
    const client: MongoClient = this.moduleRef.get<any>(
      getClientToken(this.connectionName),
    );

    if (client && client.isConnected()) await client.close();
  }

  private static createAsyncProviders(
    options: MongoModuleAsyncOptions,
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
    options: MongoModuleAsyncOptions,
  ): Provider {
    if (options.useFactory) {
      return {
        provide: MONGO_MODULE_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject ?? [],
      };
    } else if (options.useExisting) {
      return {
        provide: MONGO_MODULE_OPTIONS,
        useFactory: async (optionsFactory: MongoOptionsFactory) =>
          await optionsFactory.createMongoOptions(),
        inject: [options.useExisting],
      };
    } else if (options.useClass) {
      return {
        provide: MONGO_MODULE_OPTIONS,
        useFactory: async (optionsFactory: MongoOptionsFactory) =>
          await optionsFactory.createMongoOptions(),
        inject: [options.useClass],
      };
    } else {
      throw new Error('Invalid MongoModule options');
    }
  }
}
