var homepageRegister = require('../fixtures/homepage-register');
var testProject = require('../fixtures/testproject');
var clickElementText = require('../fixtures/click-element-text');
var size = require('../fixtures/size');

module.exports = {
  'Test opening an extension': function (browser) {

    // maximize for graphical tests
    size(browser);
    homepageRegister(browser);
    testProject(browser);

    browser
      .pause(1000)
      .waitForElementPresent('.ProjectDetail-heading-extensionList', 5000, 'expected Extension list to appear');

    clickElementText(browser, 'Test Client');

    browser.waitForElementPresent('.extensionTestClass', 5000, 'expected extension to render')
      .saveScreenshot('./test-e2e/current-screenshots/open-test-extension.png')
      .end();
  }
};
