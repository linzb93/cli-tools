import { execaCommand as execa } from 'execa';
(async () => {
  try {
    const cwd = process.argv
      .find((argv) => argv.startsWith('--cwd'))
      ?.replace('--cwd=', '');
    execa('npx vue-cli-service serve --open', {
      cwd
    });
  } catch (error) {
    (process.send as Function)({
      error,
      message: '错误'
    });
  }
})();
