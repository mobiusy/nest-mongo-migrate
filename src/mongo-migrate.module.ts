import { DynamicModule, Module } from '@nestjs/common';
import { MongoMigrateAsyncOptions, MongoMigrateOptions } from './dto/mongo-migrate-options.dto';
import { MongoMigrateService } from './mongo-migrate.service';

@Module({})
export class MongoMigrateModule {
  static register(options: MongoMigrateOptions): DynamicModule {
    return {
      module: MongoMigrateModule,
      providers: [
        {
          provide: 'MONGO_MIGRATE_OPTIONS',
          useValue: options,
        },
        MongoMigrateService,
      ],
      exports: [MongoMigrateService],
    }
  }

  static registerAsync(options: MongoMigrateAsyncOptions): DynamicModule {
    return {
      module: MongoMigrateModule,
      imports: options.imports,
      providers: [
        {
          provide: 'MONGO_MIGRATE_OPTIONS',
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
        MongoMigrateService,
      ],
      exports: [MongoMigrateService],
    }
  }
}