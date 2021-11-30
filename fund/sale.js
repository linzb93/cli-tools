const { getFundBaseTypeInformation } = require('./api');
module.exports = async code => {
    const data = await getFundBaseTypeInformation(code);
    console.log(data);
};
