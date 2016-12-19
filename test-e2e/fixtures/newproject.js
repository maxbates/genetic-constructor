var openInventoryPanel = require('./open-inventory-panel');

var newproject = function(browser) {
  browser
    .waitForElementNotPresent('.ribbongrunt-visible')
  // open projects
  openInventoryPanel(browser, 'Projects');
  browser
  .click('[data-testid="NewProjectButton"]')
  .pause(1000)
  .waitForElementPresent('.construct-viewer', 5000, 'expect a construct for the new project')
  .assert.countelements('.construct-viewer', 1);
};

module.exports = newproject;
