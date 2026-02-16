const keyChain = 'dkdbrandadmincreatedbydiankeduofront';
const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const excursion = 3;

function changeLetter(source: string, isLower?: boolean) {
    const index = letters.split('').findIndex((letter) => (isLower ? letter.toLowerCase() : letter) === source);
    const ret =
        index + excursion >= 26 ? letters.split('')[index - 26 + excursion] : letters.split('')[index + excursion];
    return isLower ? ret.toLowerCase() : ret;
}

/**
 * 加密函数，别改算法!!
 * 算法：密码每一位右边插入 keyChain 按顺序的字母，然后无论是数字还是字母往后挪3位，
 * 数字达到两位数的取个位数，字母排到z后面的从头继续循环
 */
export default (source: string) => {
    const combinedPwd = (() => {
        let ret = '';
        for (let i = 0; i < source.length; i++) {
            ret = ret + source[i] + keyChain[i];
        }
        return ret;
    })();
    let ret = '';
    for (let i = 0; i < combinedPwd.length; i++) {
        if (/\d/.test(combinedPwd[i])) {
            // 处理数字
            ret += (Number(combinedPwd[i]) + excursion) % 10;
        } else if (/[a-z]/.test(combinedPwd[i])) {
            // 处理小写字母
            ret += changeLetter(combinedPwd[i], true);
        } else if (/[A-Z]/.test(combinedPwd[i])) {
            // 处理大写字母
            ret += changeLetter(combinedPwd[i]);
        } else {
            ret += combinedPwd[i];
        }
    }
    return ret;
};
