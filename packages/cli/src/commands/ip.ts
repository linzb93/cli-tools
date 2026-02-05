import { IpService } from '@cli-tools/shared/business/ip';

export const ipCommand = (data: string[]) => {
    new IpService().main(data);
};
