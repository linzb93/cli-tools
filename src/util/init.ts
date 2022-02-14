import fs from 'fs-extra';

export default () => {
  if (!fs.existsSync('.temp')) {
    fs.mkdirsSync('.temp');
  }
};
