var homepageRegister = require('../fixtures/homepage-register');
var size = require('../fixtures/size');
var openInventory = require('../fixtures/open-inventory');

module.exports = {
  'Open inspector and verify all sections are present': function (browser) {
    size(browser);
    homepageRegister(browser);
    openInventory(browser);
    browser
      .waitForElementPresent('.InventorySectionIcon[data-section="templates"]', 5000, 'expected a section icon')
      .waitForElementPresent('.InventorySectionIcon[data-section="sketch"]', 5000, 'expected a section icon')
      .waitForElementPresent('.InventorySectionIcon[data-section="commons"]', 5000, 'expected a section icon')
      .waitForElementPresent('.InventorySectionIcon[data-section="projects"]', 5000, 'expected a section icon')
      .waitForElementPresent('.InventorySectionIcon[data-section="ncbi"]', 5000, 'expected a section icon')
      .waitForElementPresent('.InventorySectionIcon[data-section="igem"]', 5000, 'expected a section icon')
      .waitForElementPresent('.InventorySectionIcon[data-section="egf"]', 5000, 'expected a section icon')
  }
}