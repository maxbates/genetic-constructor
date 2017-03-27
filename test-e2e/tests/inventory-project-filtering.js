var homepageRegister = require('../fixtures/homepage-register');
var size = require('../fixtures/size');
var openInventoryPanel = require('../fixtures/open-inventory-panel');

var projectSetMetadata = require('../fixtures/project-set-metadata');
var openEgfProject = require('../fixtures/open-egf-project');

const projectName = 'Superduper';

module.exports = {
  'Verify we can filter projects in the inventory': function (browser) {
    size(browser);
    homepageRegister(browser);

    openInventoryPanel(browser, 'Projects');

    projectSetMetadata(browser, { name: projectName });

    const selector = `[data-expando^=${projectName}`;

    browser
    .pause(3000)
    // start with 1 samples templates 'EGF Sample Templates'
    .assert.countelements(selector, 1)
    // filter with 'pro' which should produce 3 [promoter, protease, protein stability]
    .clearValue('.InventorySearch-input')
    .setValue('.InventorySearch-input', projectName)
    .pause(1000)
    // with 'Templates' in the search field we should still see the one project
    .assert.countelements(selector, 1)
    .clearValue('.InventorySearch-input')
    .setValue('.InventorySearch-input', 'XXX')
    .pause(1000)
    // now we should see nothing
    .assert.countelements(selector, 0)
    .end();
  }
};