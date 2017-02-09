var homepageRegister = require('../fixtures/homepage-register');
var testProject = require('../fixtures/testproject');
var size = require('../fixtures/size');
module.exports = {
  'Test that dropping on the project canvas creates a new construct.' : function (browser) {
    size(browser);
    homepageRegister(browser);

    // now we can go to the project page
    browser
      // wait for inventory and inspector to be present
      .waitForElementPresent('.SidePanel.Inventory', 5000, 'Expected Inventory Groups')
      .waitForElementPresent('.SidePanel.Inspector', 5000, 'Expected Inspector');

    testProject(browser);

    // generate image for testing.
    browser
      .saveScreenshot('./test-e2e/current-screenshots/drag-to-create-construct.png')
      .end();
  }
};
