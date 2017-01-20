var size = require('../fixtures/size');

module.exports = {
  'Test homepage.' : function (browser) {
    size(browser);
    browser
      .url(browser.launchUrl + '/homepage')
      // wait for homepage to be present before starting
      .waitForElementPresent('.LandingPage', 5000, 'Expected LandingPage element to be present')
      .waitForElementPresent('#LandingPageFrame', 5000, 'Expected LandingPage iframe element to be present')
      .waitForElementNotPresent('.userwidget', 5000, 'The User Widget should not be visible on the homepage')
      .saveScreenshot('./test-e2e/current-screenshots/homepage.png')
      .end();
  }
};
