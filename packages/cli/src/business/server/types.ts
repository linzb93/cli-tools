export interface Options {
    /**
     * 打开的菜单
     * 如果为true，则会弹出菜单选择，如果为false，则不会打开菜单。
     * @default false
     * */
    menu?: boolean | string;
    /**
     * 是否自动打开浏览器
     * @default false
     * */
    open?: boolean;
    /**
     * 是否结束进程
     * @default false
     * */
    exit?: boolean;
}
