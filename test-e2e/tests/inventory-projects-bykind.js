var homepageRegister = require('../fixtures/homepage-register');
var size = require('../fixtures/size');
var openInventory = require('../fixtures/open-inventory');
var clickText = require('../fixtures/click-element-text');

module.exports = {
  'Verify we view templates by block type': function (browser) {
    size(browser);
    homepageRegister(browser);
    openInventory(browser);
    browser
    .waitForElementPresent('.InventorySectionIcon[data-section="Templates"]', 5000, 'expected a section icon')
    .click('.InventorySectionIcon[data-section="Templates"]')
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