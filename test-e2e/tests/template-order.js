var homepageRegister = require('../fixtures/homepage-register');
var newProject = require('../fixtures/newproject');
var openInventoryPanel = require('../fixtures/open-inventory-panel');
var size = require('../fixtures/size');
var dragFromTo = require('../fixtures/dragfromto.js');

module.exports = {
  'Verify we can order a template' : function (browser) {

    size(browser);
    homepageRegister(browser);
    openInventoryPanel(browser, 'Templates');
    browser
      .click('[data-testid="NewProjectButton"]')
      .click('[data-testid^="egf_project"] .label-base')
      .waitForElementPresent('[data-testid^="block-"]', 5000, 'expected constructs to appear');

    dragFromTo(browser, '[data-testid^="block-"]', 50, 10, '.inter-construct-drop-target', 50, 4);

    browser
      .click('.order-button')
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
