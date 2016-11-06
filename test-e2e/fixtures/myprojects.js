var openInventory = require('./open-inventory.js');

var myprojects = function(browser) {
  openInventory(browser);
  browser.click('.InventorySectionIcon.open[data-section="Projects"]');
};

module.exports = myprojects;
