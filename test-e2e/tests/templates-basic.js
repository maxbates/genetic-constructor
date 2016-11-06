var homepageRegister = require('../fixtures/homepage-register');
var openInventory = require('../fixtures/open-inventory');
var size = require('../fixtures/size');
var openTemplates = require('../fixtures/open-templates-sample');

module.exports = {
  'Verify all templates are available' : function (browser) {

    // maximize for graphical tests
    size(browser);
    homepageRegister(browser);
    openInventory(browser);
    openTemplates(browser);
    browser
      .click('.InventoryListGroup-title')
      .click('.Toggler')
      .waitForElementPresent('.InventoryItem-item', 5000, 'expected inventory items');
    browser
      .assert.countelements('[data-inventory~="template"]', 29)
      .assert.countelements('.construct-viewer', 29)
      .assert.countelements('[data-nodetype="block"]', 277)
      .saveScreenshot('./test-e2e/current-screenshots/templates-basic.png')
      .end();
  }
};
