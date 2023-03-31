import { ModuleMetadata, Type } from '@nestjs/common';

export interface MongoMigrateOptions {
  dbUrl: string;
  dbName?: string;
  /** absolute directory path required */
  scriptsDir: string;
  collectionName: string;
}

export interface MongoMigrateOptionsFactory {
  createMongoMigrateModuleOptions(): Promise<MongoMigrateOptions> | MongoMigrateOptions;
}

export interface MongoMigrateAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useFactory?: (
    ...args: any[]
  ) => Promise<MongoMigrateOptions> | MongoMigrateOptions;
  inject?: any[];
  // useClass?: Type<MongoMigrateOptionsFactory>;
}
