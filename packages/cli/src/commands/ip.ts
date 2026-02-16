import { ipService } from '@/business/ip';

export const ipCommand = (data: string[]) => {
    ipService(data);
};
