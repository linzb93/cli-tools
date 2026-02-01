import { logger } from '../logger';
/**
 * Logger 装饰器，用于在类方法执行前输出日志
 * 用法: @Log.info('message')
 */
export const Log = {
    success(text: string | number) {
        return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
            const originalMethod = descriptor.value;
            descriptor.value = function (...args: any[]) {
                logger.success(text);
                return originalMethod.apply(this, args);
            };
        };
    },
    info(text: string | number) {
        return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
            const originalMethod = descriptor.value;
            descriptor.value = function (...args: any[]) {
                logger.info(text);
                return originalMethod.apply(this, args);
            };
        };
    },
    warn(text: string | number) {
        return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
            const originalMethod = descriptor.value;
            descriptor.value = function (...args: any[]) {
                logger.warn(text);
                return originalMethod.apply(this, args);
            };
        };
    },
    error(text: string | number, needExit?: boolean) {
        return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
            const originalMethod = descriptor.value;
            descriptor.value = function (...args: any[]) {
                logger.error(text, needExit);
                return originalMethod.apply(this, args);
            };
        };
    },
};
