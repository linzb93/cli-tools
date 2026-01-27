import { IpService } from '@cli-tools/shared/src/business/ip';

export const ipCommand = (data: string[]) => {
    new IpService().main(data);
};
