import { deepseekService } from '@/business/deepseek';

export async function deepseekCommand() {
    await deepseekService();
}
