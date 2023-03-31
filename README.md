<p align="center">
  <a href="http://nestjs.com"><img alt="Nest Logo" src="https://nestjs.com/img/logo-small.svg" width="120" /></a>
</p>

<p align="center">
  A <a href="https://github.com/nestjs/nest">Nest</a> module for manage mongodb migration scripts.
</p>


## Installation

```bash
npm install --save nest-mongo-migrate
```

## Quick start

Import `MongoMigrateModule` into the some module `SomeModule` and use the `forRegisterAsync()` method to configure it.

```typescript
import {
  ConfigurationModule,
  ConfigurationService,
} from 'xxxx';
import { Module } from '@nestjs/common';
import { MongoMigrateModule } from 'nest-mongo-migrate';
import { resolve } from 'path';

@Module({
  imports: [
    MongoMigrateModule.registerAsync({
      useFactory: async (configService: ConfigurationService) => ({
        dbUrl: configService.dbUrl,
        dbName: configService.dbName,
        scriptsDir: resolve(__dirname, 'db/scripts'),
        collectionName: 'ScriptLog',
      }),
      imports: [ConfigurationModule],
      inject: [ConfigurationService],
    }),
  ],
})
export class SomeModule {}

```

then you can use the `MongoMigrateService` to run the migration scripts.


```typescript
import { Body, Controller, Get, Logger, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MongoMigrateService } from 'nest-mongo-migrate';

@ApiTags('Some')
@Controller('some')
export class SomeController {
  private readonly logger = new Logger(SomeController.name);

  constructor(private readonly _mongoMigrateService: MongoMigrateService) {}

  @Get('up')
  async up() {
    return this._mongoMigrateService.up();
  }

  @Get('down')
  async down() {
    return this._mongoMigrateService.down();
  }

  @Get('status')
  async status() {
    const result = await this._mongoMigrateService.status();

    return result as any[];
  }

  @Post('create')
  async create(@Body() body: { name: string }) {
    return this._mongoMigrateService.create(body.name);
  }
}

```