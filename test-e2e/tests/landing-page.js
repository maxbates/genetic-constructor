var size = require('../fixtures/size');

module.exports = {
  'Test Landing Page.' : function (browser) {
    size(browser);
    browser
    .url(browser.launchUrl + '/')
    // wait for homepage to be present before starting
    .waitForElementPresent('#heroSection', 5000, 'Expected hero section to be present')
    .waitForElementPresent('nav a.authAction', 5000, 'Expected signin button to be present')
    .saveScreenshot('./test-e2e/current-screenshots/landing-page.png')
    .end();
  }
};
