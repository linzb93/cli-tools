import { deepseekService } from '@/business/deepseek/service';

export async function deepseekCommand() {
    await deepseekService();
}
