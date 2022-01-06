const { getFundBaseTypeInformation } = require('./fund/api');

module.exports = () => {
    getFundBaseTypeInformation('012414')
        .then(res => {
            console.log(res);
        });
};
