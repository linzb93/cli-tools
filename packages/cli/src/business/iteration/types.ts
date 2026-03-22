/**
 * iteration 命令的类型定义
 */

/**
 * iteration 命令的参数类型
 */
export interface IterationOptions {
  /**
   * 是否为三级修复版本
   */
  fix?: boolean;
  /**
   * 可选的指定版本号参数
   */
  version?: string;
}