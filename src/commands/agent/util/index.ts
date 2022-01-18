import path from 'path';
import low from 'lowdb';
import FileSync from 'lowdb/adapters/FileSync.js';
import {root} from '../../../util/helper.js';
const adapter = new FileSync(path.resolve(root, 'data/agent.json'));
export const db = low(adapter);
