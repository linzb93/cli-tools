import { IpManager } from '@cli-tools/shared/src/core/ip';

export const ipCommand = (data: string[]) => {
    new IpManager().main(data);
};
