var homepageRegister = require('../fixtures/homepage-register');
var size = require('../fixtures/size');
var openInventoryPanel = require('../fixtures/open-inventory-panel');
var clickText = require('../fixtures/click-element-text');
var dragFromTo = require('../fixtures/dragfromto.js');
var openEgfProject = require('../fixtures/open-egf-project');
var saveCurrentProject = require('../fixtures/save-current-project');

module.exports = {
  'Verify we view templates by block type': function (browser) {
    size(browser);
    homepageRegister(browser);

    //add one of the EGF templates to our project
    openEgfProject(browser);
    dragFromTo(browser, '[data-testid^="block-"]', 50, 10, '.inter-construct-drop-target', 50, 4);
    saveCurrentProject(browser);

    openInventoryPanel(browser, 'Projects');
    browser.pause(500);
    clickText(browser, 'By Block', '.InventoryTabs a');

    browser
    .pause(3000)
    .assert.countelements('.InventoryListGroup', 9, 'expected 9 kinds of blocks')
    .end();
  }
};