import path from 'path';
import low from 'lowdb';
import FileSync from 'lowdb/adapters/FileSync';
import {parseImportUrl} from '@/util/helper';
const adapter = new FileSync(path.resolve(parseImportUrl(import.meta.url), 'db.json'));

export const db = low(adapter);
