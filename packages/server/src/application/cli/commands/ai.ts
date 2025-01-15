import Ai from '@/service/ai';

export default (data: string) => {
    new Ai().main(data);
};
