/**
 * Cookie 解析选项接口
 * @interface Options
 */
export interface Options {
    /**
     * 解析类型：'key' 返回键名数组，'json' 返回键值对对象
     * @default 'json'
     */
    type: 'key' | 'json';
}
