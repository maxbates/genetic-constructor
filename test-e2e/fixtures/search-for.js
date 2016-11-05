var openInventory = require('./open-inventory.js');

var searchFor = function(browser, section, term) {
  // open inventory at search tab
  openInventory(browser);
  browser
    // switch to correct section
    .waitForElementPresent(`.InventorySectionIcon.open[data-section="${section}"]`, 5000, 'section not available')
    .click(`.InventorySectionIcon.open[data-section="${section}"]`)
    .pause(1000)
    .waitForElementPresent('.InventorySearch-input', 5000, 'expect search box / input to appear')
    // enter search term and wait for results
    .clearValue('.InventorySearch-input')
    .setValue('.InventorySearch-input', term)
    .waitForElementPresent('.InventoryItem-item', 30000, 'expected results to appear');

};

module.exports = searchFor;
