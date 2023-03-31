import { Inject, Injectable, Logger, NotImplementedException } from '@nestjs/common';
import { Db, MongoClient } from 'mongodb';
import { MongoMigrateOptions } from './dto/mongo-migrate-options.dto';
import fs from 'fs';
import path, { resolve } from 'path';
import { MongoScriptLog } from './dto/script-log.dto';

@Injectable()
export class MongoMigrateService {
  private mongoClient: MongoClient;
  private readonly logger = new Logger(MongoMigrateService.name);
  constructor(
    @Inject('MONGO_MIGRATE_OPTIONS')
    private readonly options: MongoMigrateOptions,

  ) {}

  async status() {
    const collection = await this.getCollection();
    const scriptLogs = await collection.find().sort({_id: 1}).toArray();
    return scriptLogs;
  }

  async up() {
    const db = await this.getDb();
    const collection = db.collection<MongoScriptLog>(this.options.collectionName);
    const scriptLogs = await collection.find().toArray();
    const names = new Set(Array.from(scriptLogs.map(item => item.name)))
    const files = await this.readAllFile();
    for (const file of files) {
      if (names.has(file.name)) {
        continue;
      }
      const module = require(file.path);
      if (typeof module.up === 'function') {
        this.logger.log(`[UP] Run: ${file.name}`);
        // record time consuming of script in seconds
        const start = performance.now();
        await module.up(db);
        const end = performance.now();
        const scriptLog: MongoScriptLog = {
          name: file.name,
          status: 'COMPLETE',
          scriptContent: module.up.toString(),
          timeConsuming: end - start,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        await collection.insertOne(scriptLog);
      }
    }

    this.logger.log(`[UP] Finished`);
  }

  async down() {
    const db = await this.getDb();
    const collection = db.collection<MongoScriptLog>(this.options.collectionName);
    const scriptLogs = await collection.find().toArray();
    const names = new Set(Array.from(scriptLogs.map(item => item.name)))
    const files = await this.readAllFile();
    files.reverse();
    for (const file of files) {
      if (!names.has(file.name)) {
        continue;
      }
      const module = require(file.path);
      if (typeof module.down === 'function') {
        this.logger.log(`[DOWN] Run ${file.path}`);
        await module.down(db);
        await collection.deleteOne({name: file.name});
        this.logger.log(`[DOWN] Finished`);
        // roolback one script, then stop
        break;
      }
    }
  }

  async create(scriptName: string) {
    const { scriptsDir } = this.options;
    if (!path.isAbsolute(scriptsDir)) {
      throw new Error(`scriptsDir must be absolute path`);
    }
    const templatePath = resolve(__dirname, '../template/sample-migration.js');
    const content = fs.readFileSync(templatePath, 'utf-8');
    const timestamp = this.formateDate();
    fs.writeFileSync(path.join(scriptsDir, `${timestamp}_${scriptName}.js`), content);
  }

  private async getDb(): Promise<Db> {
    if (!this.mongoClient) {
      this.mongoClient = new MongoClient(this.options.dbUrl);
    }

    await this.mongoClient.connect();
    const db = this.mongoClient.db(this.options.dbName);
    return db;
  }

  private async getCollection() {
    const db = await this.getDb();
    return db.collection<MongoScriptLog>(this.options.collectionName);
  }

  private async readAllFile() {
    const { scriptsDir } = this.options;
    // check if scriptsDir is absolute path
    if (!path.isAbsolute(scriptsDir)) {
      throw new Error(`scriptsDir must be absolute path`);
    }

    const allFiles = fs.readdirSync(scriptsDir);
    // Filter files that match the pattern: 'YYYYMMDDHHmmss_*.js'
    const matchedFiles = allFiles.filter((file) => {
      return /^\d{14}_.*\.js$/.test(file);
    });
    matchedFiles.sort((a, b) => {
      const aTimestamp = parseInt(a.slice(0, 14));
      const bTimestamp = parseInt(b.slice(0, 14));
      return bTimestamp - aTimestamp;
    })
    const files: {name:string, path: string} [] = [];
    for (const file of allFiles) {
      files.push({
        name: file,
        path: path.join(scriptsDir, file)
      });
    }

    return files;
  }

  private formateDate() {
    // format current date to 'YYYYMMDDHHmmss', e.g. 20210101120000, full fill with 0
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hour = date.getHours();
    const minute = date.getMinutes();
    const second = date.getSeconds();
    return `${year}${month.toString().padStart(2, '0')}${day.toString().padStart(2, '0')}${hour.toString().padStart(2, '0')}${minute.toString().padStart(2, '0')}${second.toString().padStart(2, '0')}`;
  }
}