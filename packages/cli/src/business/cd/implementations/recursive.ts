import { recursiveBrowsePath } from '@/utils/recursivePath';
import { navigateOnly } from '../helpers/history';

/**
 * 递归浏览子目录并跳转
 * @param startPath - 起始目录的绝对路径
 */
export async function recursiveBrowse(startPath: string) {
    const targetPath = await recursiveBrowsePath(startPath);
    navigateOnly(targetPath);
}
