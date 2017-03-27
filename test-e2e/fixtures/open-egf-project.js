var openInventoryPanel = require('./open-inventory-panel');
/**
 * open the templates project
 */
module.exports = function (browser) {

  openInventoryPanel(browser, 'Commons');

  browser
  .waitForElementPresent('[data-expando^="Edinburgh Genome Foundry"] .label-base')
  .click('[data-expando^="Edinburgh Genome Foundry"] .label-base')
  .waitForElementPresent('[data-expando^="EGF Templates"] .label-base')
  .click('[data-expando^="EGF Templates"] .label-base');
};
