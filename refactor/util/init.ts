import fs from 'fs-extra';
import { root } from './helper.js';
import path from 'path';
export default () => {
  if (!fs.existsSync(path.resolve(root, '.temp'))) {
    fs.mkdirsSync(path.resolve(root, '.temp'));
  }
};
