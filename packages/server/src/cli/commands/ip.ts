import Ip from '@/core/ip';

export const ipCommand = (data: string[]) => {
    new Ip().main(data);
};
