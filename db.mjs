import { DatabaseSync } from 'node:sqlite';
import {mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {randomBytes,scryptSync,timingSafeEqual} from 'node:crypto';
export const dataDir=resolve(process.env.DATA_DIR||'data');
mkdirSync(dataDir,{recursive:true});mkdirSync(resolve(dataDir,'uploads'),{recursive:true});
export const db=new DatabaseSync(resolve(dataDir,'archive.sqlite'));
db.exec(`PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,email TEXT UNIQUE NOT NULL,name TEXT NOT NULL,password TEXT NOT NULL,role TEXT NOT NULL); CREATE TABLE IF NOT EXISTS sessions(id TEXT PRIMARY KEY,user_id TEXT NOT NULL,csrf TEXT NOT NULL,expires INTEGER NOT NULL); CREATE TABLE IF NOT EXISTS content(id INTEGER PRIMARY KEY CHECK(id=1),body TEXT NOT NULL,version INTEGER NOT NULL DEFAULT 1);`);
export function hashPassword(password){const salt=randomBytes(16).toString('hex');return salt+':'+scryptSync(password,salt,64).toString('hex');}
export function checkPassword(password,stored){try{const [salt,hash]=stored.split(':');const candidate=scryptSync(password,salt,64);const actual=Buffer.from(hash,'hex');return actual.length===candidate.length&&timingSafeEqual(actual,candidate);}catch{return false;}}
