const { requireDynamic } = require('../util');

module.exports = async () => {
    const func = await requireDynamic('doomfist');
    func();
};
