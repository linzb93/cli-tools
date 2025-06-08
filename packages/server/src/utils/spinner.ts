import ora from 'ora';
import logSymbols from 'log-symbols';
interface Setting {
    showTime: boolean;
}

export class Spinner {
    private spinner = ora({
        interval: 100,
    });
    private setting: Setting;
    get text() {
        return this.spinner.text;
    }
    set text(value) {
        if (this.spinner.text === '' || !this.spinner.isSpinning) {
            this.start();
        }
        this.spinner.text = value;
        this.spinner.spinner = 'dots';
    }
    get isSpinning() {
        return this.spinner.isSpinning;
    }
    start() {
        this.spinner.start();
    }
    warning(text: string) {
        this.spinner.text = text;
        this.spinner.spinner = {
            interval: 100,
            frames: [logSymbols.warning],
        };
    }
    succeed(text?: string, notEnd?: boolean) {
        if (notEnd) {
            if (!this.spinner.isSpinning) {
                this.spinner.start();
            }
            this.spinner.text = text as string;
            this.spinner.spinner = {
                interval: 100,
                frames: [logSymbols.success],
            };
        } else {
            this.spinner.succeed(text);
        }
    }
    fail(text: string, needExit?: boolean) {
        this.spinner.fail(text);
        if (needExit) {
            process.exit(1);
        }
    }
    /**
     * 暂停，但会清空文字
     */
    stop() {
        this.spinner.stop();
    }
    /**
     * 暂停，保持显示的文字
     */
    stopAndPersist() {
        this.spinner.stopAndPersist();
    }
    set(options: Partial<Setting>) {
        this.setting = {
            ...this.setting,
            ...options,
        };
    }
}
export default new Spinner();

/**
 * Spinner2 类是独立的计时加载器类
 * 主要特点：
 * 1. 增加了运行时间显示功能，会在文字前面显示"【已运行x秒】"
 * 2. 自动计时，每秒更新一次显示内容
 * 3. 可通过 setting.showTime 选项控制是否显示运行时间
 */
export class Spinner2 {
    private spinner = ora({
        interval: 100,
    });
    private timer: NodeJS.Timeout | null = null;
    private runningSeconds = 0;
    private originalText = '';
    private setting: Setting = {
        showTime: true,
    };

    /**
     * 获取当前显示的文本
     */
    get text() {
        return this.originalText;
    }

    /**
     * 设置显示的文本
     */
    set text(value: string) {
        this.originalText = value;
        if (this.spinner.text === '' || !this.spinner.isSpinning) {
            this.start();
        }
        this.updateText();
    }

    /**
     * 获取当前是否正在旋转
     */
    get isSpinning() {
        return this.spinner.isSpinning;
    }

    /**
     * 更新显示文本，添加运行时间前缀
     */
    private updateText() {
        if (this.setting.showTime && this.isSpinning) {
            this.spinner.text = `【已运行${this.runningSeconds}秒】${this.originalText}`;
        } else {
            this.spinner.text = this.originalText;
        }
        this.spinner.spinner = 'dots';
    }

    /**
     * 开始计时器
     */
    private startTimer() {
        // 清除可能存在的旧计时器
        this.clearTimer();
        this.runningSeconds = 0;

        // 启动新计时器
        this.timer = setInterval(() => {
            this.runningSeconds++;
            this.updateText();
        }, 1000);
    }

    /**
     * 清除计时器
     */
    private clearTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    /**
     * 开始旋转加载
     */
    start() {
        this.spinner.start();
        this.startTimer();
        this.updateText();
    }

    /**
     * 显示警告状态
     */
    warning(text: string) {
        this.originalText = text;
        this.spinner.text =
            this.setting.showTime && this.runningSeconds > 0 ? `【已运行${this.runningSeconds}秒】${text}` : text;
        this.spinner.spinner = {
            interval: 100,
            frames: [logSymbols.warning],
        };
    }

    /**
     * 成功状态
     */
    succeed(text?: string, notEnd?: boolean) {
        if (text) {
            this.originalText = text;
        }

        const displayText =
            this.setting.showTime && this.runningSeconds > 0
                ? `【已运行${this.runningSeconds}秒】${this.originalText}`
                : this.originalText;

        if (notEnd) {
            if (!this.spinner.isSpinning) {
                this.spinner.start();
            }
            this.spinner.text = displayText;
            this.spinner.spinner = {
                interval: 100,
                frames: [logSymbols.success],
            };
        } else {
            this.clearTimer();
            this.spinner.succeed(displayText);
        }
    }

    /**
     * 失败状态
     */
    fail(text: string, needExit?: boolean) {
        this.clearTimer();
        const displayText =
            this.setting.showTime && this.runningSeconds > 0 ? `【已运行${this.runningSeconds}秒】${text}` : text;
        this.spinner.fail(displayText);
        if (needExit) {
            process.exit(1);
        }
    }

    /**
     * 暂停，但会清空文字
     */
    stop() {
        this.clearTimer();
        this.spinner.stop();
    }

    /**
     * 暂停，保持显示的文字
     */
    stopAndPersist() {
        this.clearTimer();
        this.spinner.stopAndPersist();
    }

    /**
     * 设置配置
     */
    set(options: Partial<Setting>) {
        this.setting = {
            ...this.setting,
            ...options,
        };

        // 如果设置更改了显示时间选项，立即更新显示
        this.updateText();
    }
}

/**
 * 导出一个Spinner2的实例，方便用户直接使用
 */
export const spinner2 = new Spinner2();
