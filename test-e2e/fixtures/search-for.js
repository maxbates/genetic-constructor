var openInventoryPanel = require('./open-inventory-panel.js');

var searchFor = function(browser, section, term) {
  // open inventory at search tab
  openInventoryPanel(browser, section);
  browser
    .waitForElementPresent('.InventorySearch-input', 5000, 'expect search box / input to appear')
    // enter search term and wait for results
    .clearValue('.InventorySearch-input')
    .setValue('.InventorySearch-input', term)
    .waitForElementPresent('.InventoryItem-item', 30000, 'expected results to appear');

};

module.exports = searchFor;
