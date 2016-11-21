var homepageRegister = require('../fixtures/homepage-register');
var size = require('../fixtures/size');
var openInventoryPanel = require('../fixtures/open-inventory-panel');

module.exports = {
  'Verify all templates are available' : function (browser) {

    // maximize for graphical tests
    size(browser);
    homepageRegister(browser);
    openInventoryPanel(browser, 'Templates');
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
