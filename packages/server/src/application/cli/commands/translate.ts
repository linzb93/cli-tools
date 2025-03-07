import Translate, { Options } from '@/service/translate';

export default (text: string, options: Options) => {
    new Translate().main(text, options);
};
