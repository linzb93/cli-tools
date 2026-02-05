import { ipService } from '@cli-tools/shared/business/ip';

export const ipCommand = (data: string[]) => {
    ipService(data);
};
