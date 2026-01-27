import { VueManager, Options } from '@cli-tools/shared/src/core/vue';

export const vueCommand = (options: Options) => {
    new VueManager().main(options);
};
