import chokidar from 'chokidar';

/**
 * Sass依赖图结构
 */
export interface DepNode {
    name: string;
    refed: string[];
}

/**
 * Sass服务上下文
 */
export interface SassContext {
    depRepo: DepNode[];
    watcher: chokidar.FSWatcher | null;
    reg: RegExp;
}
