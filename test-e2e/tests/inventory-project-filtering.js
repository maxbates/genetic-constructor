var homepageRegister = require('../fixtures/homepage-register');
var size = require('../fixtures/size');
var openInventory = require('../fixtures/open-inventory');

module.exports = {
  'Verify we can filter projects in the inventory': function (browser) {
    size(browser);
    homepageRegister(browser);
    openInventory(browser);
    browser
    .waitForElementPresent('.InventorySectionIcon[data-section="Templates"]', 5000, 'expected a section icon')
    .click('.InventorySectionIcon[data-section="Templates"]')
    .pause(3000)
    // start with 1 samples templates 'EGF Sample Templates'
    .assert.countelements('[data-inventory~="project"]', 1)
    // filter with 'pro' which should produce 3 [promoter, protease, protein stability]
    .clearValue('.InventorySearch-input')
    .setValue('.InventorySearch-input', 'xxx')
    .pause(3000)
    .assert.countelements('[data-inventory~="project"]', 0)
    .clearValue('.InventorySearch-input')
    .setValue('.InventorySearch-input', 'EGF')
    .pause(1000)
    .assert.countelements('[data-inventory~="project"]', 1)
    .end();
  }
};