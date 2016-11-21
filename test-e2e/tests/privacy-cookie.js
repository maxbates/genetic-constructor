var size = require('../fixtures/size');

module.exports = {
  'Test that the privacy cookie warning appears and can be closed.' : function (browser) {
    size(browser);
    browser
    .url(browser.launchUrl + '/homepage')
    .waitForElementPresent('.homepage-cookie-warning')
    .waitForElementPresent('.homepage-cookie-close')
    .pause(3000)
    .click('.homepage-cookie-close')
    .waitForElementNotPresent('.homepage-cookie-warning')
    .end();
  }
};
