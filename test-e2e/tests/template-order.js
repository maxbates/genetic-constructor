var homepageRegister = require('../fixtures/homepage-register');
var newProject = require('../fixtures/newproject');
var openInventoryPanel = require('../fixtures/open-inventory-panel');
var size = require('../fixtures/size');
var dragFromTo = require('../fixtures/dragfromto.js');
var openEgfProject = require('../fixtures/open-egf-project');

module.exports = {
  'Verify we can order a template' : function (browser) {

    size(browser);
    homepageRegister(browser);
    newProject(browser);

    openEgfProject(browser);
    dragFromTo(browser, '[data-testid^="block-"]', 50, 10, '.inter-construct-drop-target', 50, 4);

    browser
      .click('.construct-viewer .title-and-toolbar [data-id="Order DNA"]')
      .waitForElementPresent('.order-form .page1', 10000, 'expected order dialog to appear')
      .pause(1000)
      .submitForm('.order-form')
      .waitForElementPresent('.order-form .page3', 120000, 'expect summary page to appear')
      // click done
      .click('.order-form button:nth-of-type(1)')
      .waitForElementNotPresent('.order-form', 10000, 'expected order dialog to go away')
      .end();
  }
};
