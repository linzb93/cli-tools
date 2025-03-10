import Ai from '@/service/ai';

export default (input: string, rest: string[]) => {
    new Ai().main(input, rest);
};
