import { VueService, Options } from '@cli-tools/shared/src/business/vue';

export const vueCommand = (options: Options) => {
    new VueService().main(options);
};
