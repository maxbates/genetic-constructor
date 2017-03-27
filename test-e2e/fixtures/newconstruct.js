var rightClickAt = require('./rightClickAt');
var clickNthContextMenuItem = require('./click-popmenu-nth-item');

var newconstruct = function(browser) {
    browser
      .pause(250)

    rightClickAt(browser, '.inventory-project-tree [data-testid^="inventoryProject/project"]', 20, 10);
    clickNthContextMenuItem(browser, 4);

    browser
      .pause(1000)
      .waitForElementPresent('.construct-viewer', 5000, 'expected at least one construct viewer')
};

module.exports = newconstruct;
