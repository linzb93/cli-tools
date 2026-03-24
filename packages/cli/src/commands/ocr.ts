import { ocrService } from '@/business/ocr/service';
import type { OCROptions } from '@/business/ocr/types';

/**
 * OCR命令入口函数
 * @param options 命令选项
 */
export function ocrCommand(options: OCROptions): void {
    ocrService(options);
}
