import { execaCommand as execa } from 'execa';
import through from 'through2';
import { emptyWritableStream } from '../../util/helper.js';
const cwd = process.argv
  .find((argv) => argv.startsWith('--cwd'))
  ?.replace('--cwd=', '');
const child = execa('npx vue-cli-service serve', {
  cwd
});
child.stdout
  ?.pipe(
    through(function (data, enc, callback) {
      if (data.toString().includes('- Network:')) {
        const match = data.toString().match(/- Network: (.+)/);
        if (match) {
          process.send?.({
            url: match[1]
          });
        } else {
          process.send?.({
            message: 'url not found'
          });
        }
      }
      this.push(data);
      callback();
    })
  )
  .pipe(emptyWritableStream);
child.stderr
  ?.pipe(
    through(function (data, enc, callback) {
      if (
        ['Error:', 'ERROR'].some((text: string) =>
          data.toString().includes(text)
        )
      ) {
        process.send?.({
          message: data.toString()
        });
      }
      this.push(data);
      callback();
    })
  )
  .pipe(emptyWritableStream);
process.on('unhandledRejection', (e) => {
  process.send?.({
    message: (e as Error).message
  });
});
