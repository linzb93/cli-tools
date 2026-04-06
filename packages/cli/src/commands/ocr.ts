import { ocrService } from '@/business/ocr';
import type { OCROptions } from '@/business/ocr';

/**
 * OCR命令入口函数
 * @param options 命令选项
 */
export function ocrCommand(options: OCROptions): void {
    ocrService(options);
}
