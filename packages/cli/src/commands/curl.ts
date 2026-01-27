import { CurlManager, Options } from '@cli-tools/shared/src/core/curl';

export const curlCommand = (options: Options) => {
    return new CurlManager().main(options);
};
