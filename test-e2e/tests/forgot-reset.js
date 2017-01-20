const signout = require('../fixtures/signout');
const signin = require('../fixtures/signin');
const size = require('../fixtures/size');

// NOTE: Doesn't check the full pathway since getting the email is impossible.
// just that we can make the forms appear
module.exports = {
  'Test forgot password and reset password form': function (browser) {
    size(browser);
    browser
    .url(`${browser.launchUrl}/homepage/forgot`)
    .waitForElementPresent('#forgot-form', 5000, 'Expected form to be present')
    .pause(2000)
    .click('.Modal-header-close')
    .waitForElementNotPresent('#forgot-form', 5000, 'Expected form to go away')
    .url(`${browser.launchUrl}/homepage/reset`)
    .waitForElementPresent('#reset-form', 5000, 'Expected form to be present')
    .pause(2000)
    .click('.Modal-header-close')
    .waitForElementNotPresent('#reset-form', 5000, 'Expected form to go away')
    .end();
  },
};
