var homepageRegister = require('../fixtures/homepage-register');
var size = require('../fixtures/size');
var openInventory = require('../fixtures/open-inventory');

module.exports = {
  'Open inspector and verify all sections are present': function (browser) {
    size(browser);
    homepageRegister(browser);
    openInventory(browser);
    browser
      .waitForElementPresent('.InventorySectionIcon[data-section="Templates"]', 5000, 'expected a section icon')
      .waitForElementPresent('.InventorySectionIcon[data-section="Sketch"]', 5000, 'expected a section icon')
      .waitForElementPresent('.InventorySectionIcon[data-section="Commons"]', 5000, 'expected a section icon')
      .waitForElementPresent('.InventorySectionIcon[data-section="Projects"]', 5000, 'expected a section icon')
      .waitForElementPresent('.InventorySectionIcon[data-section="Ncbi"]', 5000, 'expected a section icon')
      .waitForElementPresent('.InventorySectionIcon[data-section="Igem"]', 5000, 'expected a section icon')
      .waitForElementPresent('.InventorySectionIcon[data-section="Egf"]', 5000, 'expected a section icon')
      .end();
  }
}