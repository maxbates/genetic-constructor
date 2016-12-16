
var openInspectorPanel= function(browser, sectionName) {
  var sectionSelector = `.SidePanel.Inspector.visible .open [data-section="${sectionName}"][data-selected="true"]`;
  browser
  // make sure inspector is present
  .waitForElementPresent('.SidePanel.Inspector', 5000, 'Expected Inspector');
  // now determine if the inspector is already open at the right panel
  browser.execute(function(sectionSelector) {
    return !!document.querySelector(sectionSelector);
  }, [sectionSelector], function(result) {
    if (!result.value) {
      browser
      .click(`.SidePanel.Inspector [data-section="${sectionName}"]`)
      .waitForElementPresent(sectionSelector, 5000, 'expected section to open')
    }
  });
};

module.exports = openInspectorPanel;