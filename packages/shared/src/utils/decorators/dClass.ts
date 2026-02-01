/**
 * 类装饰器
 *
 * 在类定义时执行
 */
export function dClass(constructor: Function) {
    console.log('类装饰器已使用');
}
