import { cdService } from '../business/cd';

export function cdCommand(targetPath?: string) {
    cdService(targetPath);
}
