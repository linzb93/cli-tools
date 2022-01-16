const createProxy = (rawObject, options) => {
    const getArr = [];
    const setArr = [];
    for (const prop in options) {
        if (typeof options[prop] === 'function') {
            getArr.push({
                prop,
                callback: options[prop]
            });
        } else {
            if (options[prop].get) {
                getArr.push({
                    prop,
                    callback: options[prop].get
                });
            }
            if (options[prop].set) {
                setArr.push({
                    prop,
                    callback: options[prop].set
                });
            }
        }
    }
    return new Proxy(rawObject, {
        get(target, propKey, receiver) {
            const match = getArr.find(item => item.prop === propKey);
            if (match) {
                match.callback();
            }
            return Reflect.get(target, propKey, receiver);
        },
        set(target, propKey, value, receiver) {
            const match = setArr.find(item => item.prop === propKey);
            if (match) {
                match.callback(value);
            }
            return Reflect.set(target, propKey, value, receiver);
        }
    });
};

module.exports = createProxy;
