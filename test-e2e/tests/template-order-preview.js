var homepageRegister = require('../fixtures/homepage-register');
var size = require('../fixtures/size');
var openInventoryPanel = require('../fixtures/open-inventory-panel');
var dragFromTo = require('../fixtures/dragfromto.js');

module.exports = {
  'Verify we can preview order assemblies' : function (browser) {

    size(browser);
    homepageRegister(browser);
    openInventoryPanel(browser, 'Templates');
    browser
    .click('[data-testid="NewProjectButton"]')
    .click('[data-testid^="egf_project"] .label-base')
    .waitForElementPresent('[data-testid^="block-"]', 5000, 'expected constructs to appear');

    dragFromTo(browser, '[data-testid^="block-"]', 50, 10, '.cvc-drop-target', 50, 40);

    browser
      .click('.order-button')
      .waitForElementPresent('.order-form .page1', 10000, 'expected order dialog to appear')
      .pause(3000)
      // goto review page
      .click('.buttons + .nav-left-right')
      .waitForElementPresent('.order-form .page2 .scenegraph', 5000, 'expected page 2 with construct viewer')
      .waitForElementPresent('[data-nodetype="block"]', 5000, 'expected some blocks')
      // screen shot for image tests
      .saveScreenshot('./test-e2e/current-screenshots/template-order-preview.png')
      .submitForm('.order-form')
      .waitForElementPresent('.order-form .page3', 120000, 'expect summary page to appear')
      // click done
      .click('.order-form button:nth-of-type(1)')
      .waitForElementNotPresent('.order-form', 10000, 'expected order dialog to go away')

    browser.end();
  }
};
