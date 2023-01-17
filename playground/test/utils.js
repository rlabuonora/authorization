const cheerio = require('cheerio');

module.exports.getAlert = function (response) {
  const $ = cheerio.load(response.text);
  const alertMessage = $('.alert')[0].children[0].data.trim();
  return alertMessage;
};
