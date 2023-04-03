import { ObjectId } from 'mongodb';

export interface MongoScriptLog {
  _id?: ObjectId;
  name: string;
  status: 'RUNNING' | 'COMPLETE';
  scriptContent: string;
  /** milliseconds to execute */
  timeConsuming: number;
  createdAt: Date;
}

export interface ScriptLogDto {
  /** Script name */
  name: string;

  /** Script running status */
  status: string;

  /** Script content */
  scriptContent: string;

  /** Milliseconds to execute */
  timeConsuming: number;

  /** Created time */
  createdAt: string;
}