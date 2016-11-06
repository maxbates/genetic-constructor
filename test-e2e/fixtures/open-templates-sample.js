var openInventory = require('./open-inventory');


var openTemplatesSample = function(browser) {
  openInventory(browser);
  browser.click('.InventorySectionIcon.open[data-section="Templates"]');
};

module.exports = openTemplatesSample;
