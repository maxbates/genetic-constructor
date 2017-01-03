var homepageRegister = require('../fixtures/homepage-register');
var newProject = require('../fixtures/newproject');
var openInventoryPanel = require('../fixtures/open-inventory-panel');
var openInspectorPanel = require('../fixtures/open-inspector-panel');
var size = require('../fixtures/size');
var dragFromTo = require('../fixtures/dragfromto.js');

module.exports = {
  'Test order history in inspector panel' : function (browser) {

    size(browser);
    homepageRegister(browser);
    openInventoryPanel(browser, 'Templates');
    newProject(browser);
    browser
    // expand 1st project
    .pause(2000)
    .click('.inventory-project-tree .tree div:nth-of-type(1) .expando')
    .pause(2000)
    .waitForElementPresent('.inventory-project-tree [data-testid^="block"]');

    dragFromTo(browser, '.inventory-project-tree [data-testid^="block"]', 50, 10, '.cvc-drop-target', 50, 40);

    browser
      .click('.order-button')
      .waitForElementPresent('.order-form .page1', 10000, 'expected order dialog to appear')
      .pause(1000)
      .submitForm('.order-form')
      .waitForElementPresent('.order-form .page3', 120000, 'expect summary page to appear')
      // click done
      .click('.order-form button:nth-of-type(1)')
      .waitForElementNotPresent('.order-form', 10000, 'expected order dialog to go away');

    openInspectorPanel(browser, 'Orders');
    browser
      .waitForElementPresent('.InspectorGroupOrders')
      .waitForElementPresent('.InspectorGroupOrders [data-expando="Order 1"]')
      .click('.InspectorGroupOrders [data-expando="Order 1"]')
      .assert.countelements('.InspectorGroupOrders [data-expando="Order 1"] .row', 6)
      .click('.InspectorGroupOrders [data-expando="Order 1"] a')
      .waitForElementPresent('.order-form .page3', 5000, 'expect summary page to appear')
      .end();
  }
};
