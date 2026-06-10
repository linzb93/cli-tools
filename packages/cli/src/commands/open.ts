import { openService } from '@/business/open';
import type { OpenOptions } from '@/business/open';

export function openCommand(options: OpenOptions) {
    return openService(options);
}
