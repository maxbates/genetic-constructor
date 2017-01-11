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
    .assert.countelements('[data-testid^="egf_project"]', 1)
    // filter with 'pro' which should produce 3 [promoter, protease, protein stability]
    .clearValue('.InventorySearch-input')
    .setValue('.InventorySearch-input', 'Templates')
    .pause(1000)
    // with 'Templates' in the search field we should still see the one project
    .assert.countelements('[data-testid^="egf_project"]', 1)
    .clearValue('.InventorySearch-input')
    .setValue('.InventorySearch-input', 'XXX')
    .pause(1000)
    // now we should see nothing
    .assert.countelements('[data-testid^="egf_project"]', 0)
    .end();
  }
};