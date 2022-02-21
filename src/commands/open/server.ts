import { execaCommand as execa } from 'execa';
// import fs from 'fs-extra';
(async () => {
  try {
    const cwd = process.argv
      .find((argv) => argv.startsWith('--cwd'))
      ?.replace('--cwd=', '');
    execa('npx vue-cli-service serve --open', {
      cwd,
      stdio: 'inherit'
    });
  } catch (error) {
    (process.send as Function)({
      error,
      message: '错误'
    });
  }
})();
