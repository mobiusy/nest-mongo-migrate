import { ObjectId } from 'mongodb';

export interface ScriptLogDto {
  name: string;
  status: 'RUNNING' | 'COMPLETE';
  scriptContent: string;
  /** milliseconds to execute */
  timeConsuming: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MongoScriptLog extends ScriptLogDto {
  _id?: ObjectId;
}