<p align="center">
  <a href="http://nestjs.com"><img alt="Nest Logo" src="https://nestjs.com/img/logo-small.svg" width="120" /></a>
</p>

<p align="center">
  A <a href="https://github.com/nestjs/nest">Nest</a> module for manage and run mongodb migration scripts. Inspired by <a href="https://www.npmjs.com/package/migrate-mongo"> migrate-mongo </a>
</p>


## Installation

```bash
npm install --save nest-mongo-migrate
```

## Quick start

Import `MongoMigrateModule` into the some module `SomeModule` and use the `register()` method to configure it.

```typescript
import { Module } from '@nestjs/common';
import { MongoMigrateModule } from 'nest-mongo-migrate';
import { resolve } from 'path';

@Module({
  imports: [
    MongoMigrateModule.register({
      dbUrl: configService.dbUrl,
      dbName: configService.dbName,
      scriptsDir: resolve(__dirname, 'db/scripts'),
      collectionName: 'ScriptLog',
    }),
  ],
})
export class SomeModule {}

```

## Async Configuration

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
        dbUrl: configService.dbUrl, // mongodb://localhost:27017
        dbName: configService.dbName, // test
        scriptsDir: resolve(__dirname, 'db/scripts'), // the scripts dir
        collectionName: 'ScriptLog', // the collection name to store the script log
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
    // run all the scripts
    return this._mongoMigrateService.up();
  }

  @Get('down')
  async down() {
    // rollback latest one script
    return this._mongoMigrateService.down();
  }

  @Get('status')
  async status() {
    // get the scripts status in db
    return await this._mongoMigrateService.status();
  }

  @Post('create')
  async create(@Body() body: { name: string }) {
    // create a new migration script, the name is the file name
    // a file named `<timestamp>_<name>.js` will be created in the scripts dir
    return this._mongoMigrateService.create(body.name);
  }
}

```

## Create a migration script

### naming convention

`<timestamp>_<name>.js`, for example: `20230403123456_init-user.js`

### script template

```javascript
/**
 * description: xxxxxxxxxx
 */

module.exports = {
  /**
   * upgrade script
   * @param {mongo.Db} db 
   */
  async up(db) {
    // TODO write your migration here.
    // Example:
    // await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: true}});
  },

  /**
   * downgrade script
   * @param {mongo.Db} db 
   */
  async down(db) {
    // TODO write the statements to rollback your migration (if possible)
    // Example:
    // await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: false}});
  }
};

```

## TODO
- Add transaction supoort if db in replica set mode
- Add cli command supoort
- Refactor dependency