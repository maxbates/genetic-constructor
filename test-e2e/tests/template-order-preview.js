var homepageRegister = require('../fixtures/homepage-register');
var size = require('../fixtures/size');
var openInventoryPanel = require('../fixtures/open-inventory-panel');
var dragFromTo = require('../fixtures/dragfromto.js');
var newProject = require('../fixtures/newproject');

module.exports = {
  'Verify we can preview order assemblies' : function (browser) {

    size(browser);
    homepageRegister(browser);
    newProject(browser);
    openInventoryPanel(browser, 'Templates');
    browser
      .waitForElementPresent('[data-testid^="egf_project"] .label-base')
      .click('[data-testid^="egf_project"] .label-base')
      .waitForElementPresent('[data-testid^="block-"]');

    dragFromTo(browser, '[data-testid^="block-"]', 50, 10, '.inter-construct-drop-target', 50, 4);

    browser
      .click('.construct-viewer .title-and-toolbar [data-id="Order DNA"]')
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
