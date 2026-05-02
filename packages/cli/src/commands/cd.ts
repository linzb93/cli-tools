import { cdService } from '../business/cd';
import type { Options } from '../business/cd/types';

export function cdCommand(targetPath?: string, options?: Options) {
    cdService(targetPath, options);
}
