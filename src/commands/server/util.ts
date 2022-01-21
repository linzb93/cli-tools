
const dayjs = require('dayjs');
const fs = require('fs-extra');
const path = require('path');
const resolve = (src:string) => path.resolve(__dirname, src);
// 只处理HH:mm格式的

class TimeClass {
    private time:string;
    constructor(time:string) {
        this.time = time;
    }
    isAfter(ctor:TimeClass) {
        if (ctor instanceof TimeClass === false) {
            throw new Error('类型错误');
        }
        if (!ctor.time) {
            const now = dayjs().format('HH:mm');
            const timeSeg = this.time.split(':');
            const nowSeg = now.split(':');
            if (Number(timeSeg[0]) > Number(nowSeg[0])) {
                return true;
            }
            if (Number(timeSeg[0]) < Number(nowSeg[0])) {
                return false;
            }
            return Number(timeSeg[1]) > Number(nowSeg[1]);
        }
        return true;
    }
}
export const timejs = (time?:string) => {
    return new TimeClass(time);
};
export const serverDB = {
    get(key:string) {
        const data = fs.readJSONSync(resolve('server/meta.json'));
        return data.files.find(file => file.name === key);
    },
    set(key:string, entity:any) {
        const data = fs.readJSONSync(resolve('server/meta.json'));
        let match = data.files.find(file => file.name === key);
        // eslint-disable-next-line no-unused-vars
        if (match) {
            match = { ...match, ...entity };
        } else {
            data.files.push(entity);
        }
        fs.writeJsonSync(resolve('server/meta.json'), data);
    }
};
