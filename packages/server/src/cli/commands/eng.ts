import Translate, { Options } from '@/core/eng';

export default (text: string, options: Options) => {
    new Translate().main(text, options);
};
