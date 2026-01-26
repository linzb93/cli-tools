import { VueManager, Options } from '@/core/vue';
export const vueCommand = (options: Options) => {
    new VueManager().main(options);
};
