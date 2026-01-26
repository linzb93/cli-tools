import { IpManager } from '@/core/ip';

export const ipCommand = (data: string[]) => {
    new IpManager().main(data);
};
