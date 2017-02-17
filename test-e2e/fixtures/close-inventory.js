
var closeInventoryPanel = function(browser) {
  var sectionSelector = '.SidePanel.Inventory.visible [data-selected="true"]';
  browser
  // make sure inspector is present
  .waitForElementPresent('.SidePanel.Inventory', 5000, 'Expected Inventory');
  // now determine if the inspector is already open
  browser.execute(function(sectionSelector) {
    return document.querySelector(sectionSelector);
  }, [sectionSelector], function(result) {
    if (result.value) {
      browser
      .click(sectionSelector)
      .waitForElementNotPresent(sectionSelector, 5000, 'expected inventory to be closed');
    }
  });
};

module.exports = closeInventoryPanel;