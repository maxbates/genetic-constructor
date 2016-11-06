var homepageRegister = require('../fixtures/homepage-register');
var newProject = require('../fixtures/newproject');
var size = require('../fixtures/size');
var openTemplates = require('../fixtures/open-templates-sample');
var dragFromTo = require('../fixtures/dragfromto.js');

module.exports = {
  'Verify we can preview order assemblies' : function (browser) {

    size(browser);
    homepageoRegister(browser);
    openTemplates(browser);
    newProject(browser);
    browser
      .click('.Toggler')
      .waitForElementPresent('.InventoryItem-item', 5000, 'expected inventory items');
    dragFromTo(browser, '.InventoryItem-item', 10, 10, '.cvc-drop-target', 50, 40);
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
