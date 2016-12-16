var homepageRegister = require('../fixtures/homepage-register');
var size = require('../fixtures/size');
var openInventoryPanel = require('../fixtures/open-inventory-panel');
var clickText = require('../fixtures/click-element-text');

module.exports = {
  'Verify we view templates by block type': function (browser) {
    size(browser);
    homepageRegister(browser);
    openInventoryPanel(browser, 'Templates');
    browser
    .pause(3000)
    // start with 1 samples templates 'EGF Sample Templates'
    .assert.countelements('[data-inventory~="project"]', 1);
    clickText(browser, 'By Kind', '.InventoryTabs a');
    browser
      .pause(3000)
      .assert.countelements('.InventoryListGroup', 11, 'expected 11 kinds of blocks')
      .end();
  }
};