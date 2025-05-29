import logSymbols from 'log-symbols';
export const logger = {
    error(text) {
        console.log(`${logSymbols.error} ${text}`);
    },
    warn(text) {
        console.log(`${logSymbols.warning} ${text}`);
    },
    success(text) {
        console.log(`${logSymbols.success} ${text}`);
    },
    info(text) {
        console.log(`${logSymbols.info} ${text}`);
    },
};
export const sleep = (time) =>
    new Promise<void>((resolve) => {
        setTimeout(() => {
            resolve();
        }, time);
    });
