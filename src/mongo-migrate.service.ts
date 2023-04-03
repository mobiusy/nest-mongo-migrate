import { Inject, Injectable, Logger, NotImplementedException } from '@nestjs/common';
import { Db, MongoClient } from 'mongodb';
import { MongoMigrateOptions } from './dto/mongo-migrate-options.dto';
import fs from 'fs';
import path, { resolve } from 'path';
import { MongoScriptLog, ScriptLogDto } from './dto/script-log.dto';

@Injectable()
export class MongoMigrateService {
  private mongoClient: MongoClient;
  private readonly logger = new Logger(MongoMigrateService.name);
  constructor(
    @Inject('MONGO_MIGRATE_OPTIONS')
    private readonly options: MongoMigrateOptions,

  ) {}

  /**
   * Get current db script logs
   * @returns 
   */
  async status() {
    const collection = await this.getCollection();
    const mongoScriptLogs = await collection.find().sort({_id: 1}).toArray();
    const scriptLogs: ScriptLogDto[] = [];
    for (const scriptLog of mongoScriptLogs) {
      scriptLogs.push({
        name: scriptLog.name,
        status: scriptLog.status,
        scriptContent: scriptLog.scriptContent,
        timeConsuming: scriptLog.timeConsuming,
        createdAt: this.formateDate(scriptLog.createdAt, 'YYYY-MM-DD HH:mm:ss'),
      });
    }

    return scriptLogs;
  }

  /**
   * Running all script file in `scriptsDir` folder
   * @returns scripts that runned
   */
  async up() {
    const db = await this.getDb();
    const collection = db.collection<MongoScriptLog>(this.options.collectionName);
    const scriptLogs = await collection.find().toArray();
    const names = new Set(Array.from(scriptLogs.map(item => item.name)))
    const files = await this.readAllFile();
    const scripts: string[] = [];
    for (const file of files) {
      if (names.has(file.name)) {
        continue;
      }
      const module = require(file.path);
      if (typeof module.up === 'function') {
        this.logger.log(`[UP] Run: ${file.name}`);
        // record time consuming of script in milliseconds
        const start = Date.now();
        await module.up(db);
        const end = Date.now();
        const scriptLog: MongoScriptLog = {
          name: file.name,
          status: 'COMPLETE',
          scriptContent: module.up.toString(),
          timeConsuming: end - start,
          createdAt: new Date(),
        };
        await collection.insertOne(scriptLog);
        scripts.push(file.name);
      }
    }

    this.logger.log(`[UP] Finished`);
    return scripts;
  }

  /**
   * Downgrade latest scripts in db
   * @returns scripts that roolbacked
   */
  async down() {
    const db = await this.getDb();
    const collection = db.collection<MongoScriptLog>(this.options.collectionName);
    const scriptLogs = await collection.find().toArray();
    const names = new Set(Array.from(scriptLogs.map(item => item.name)))
    const files = await this.readAllFile();
    files.reverse();
    const scripts: string[] = [];
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
        scripts.push(file.name);
        break;
      }
    }

    return scripts;
  }

  /**
   * create a new script file by inner template
   * @param scriptName name of script, eg: init-admin-user
   * @returns script file name
   */
  async create(scriptName: string) {
    const { scriptsDir } = this.options;
    if (!path.isAbsolute(scriptsDir)) {
      throw new Error(`scriptsDir must be absolute path`);
    }
    const templatePath = resolve(__dirname, '../template/sample-migration.js');
    const content = fs.readFileSync(templatePath, 'utf-8');
    const timestamp = this.formateDate(new Date(), 'YYYYMMDDHHmmss');
    const script = `${timestamp}_${scriptName}.js`;
    fs.writeFileSync(path.join(scriptsDir, script), content);
    return script;
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

  /**
   * 
   * @returns 
   */
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
    }).sort((a, b) => {
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

  // add function to format date by format string
  private formateDate(date: Date, format: string) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hour = date.getHours();
    const minute = date.getMinutes();
    const second = date.getSeconds();

    return format
      .replace('YYYY', year.toString())
      .replace('MM', month.toString().padStart(2, '0'))
      .replace('DD', day.toString().padStart(2, '0'))
      .replace('HH', hour.toString().padStart(2, '0'))
      .replace('mm', minute.toString().padStart(2, '0'))
      .replace('ss', second.toString().padStart(2, '0'));
  }
}