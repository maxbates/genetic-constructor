var homepageRegister = require('../fixtures/homepage-register');
var size = require('../fixtures/size');
var openInventoryPanel = require('../fixtures/open-inventory-panel');

module.exports = {
  'Verify we can filter projects in the inventory': function (browser) {
    size(browser);
    homepageRegister(browser);
    openInventoryPanel(browser, 'Templates');
    browser
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