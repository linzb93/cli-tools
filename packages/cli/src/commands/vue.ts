import { VueService, Options } from '@cli-tools/shared/business/vue';

export const vueCommand = (options: Options) => {
    new VueService().main(options);
};
