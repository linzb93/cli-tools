import { recursiveBrowsePath } from '@/utils/recursive-path';
import { open as webOpen } from '@/utils/web';
import editor from '@/utils/editor';
import type { OpenOptions } from './types';

export async function openService(options: OpenOptions) {
    const dir = await recursiveBrowsePath(process.cwd());

    if (options.type === 'vscode') {
        await editor.open(dir);
    } else {
        await webOpen(dir);
    }
}
