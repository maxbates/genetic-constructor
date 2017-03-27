
var openInventoryPanel= function(browser, sectionName) {
  var sectionSelector = `.SidePanel.Inventory.visible [data-section="${sectionName}"][data-selected="true"]`;
  browser
  // make sure inspector is present
  .waitForElementPresent('.SidePanel.Inventory', 5000, 'Expected Inventory');
  // now determine if the inspector is already open at the right panel
  browser.execute(function(sectionSelector) {
    return !!document.querySelector(sectionSelector);
  }, [sectionSelector], function(result) {
    if (!result.value) {
      browser
      .click(`.SidePanel.Inventory [data-section="${sectionName}"]`)
      .waitForElementPresent(sectionSelector, 5000, 'expected section to open')
    }
  });
};

module.exports = openInventoryPanel;