var clickNthContextMenuItem = require('./click-popmenu-nth-item');
var openInventoryPanel = require('./open-inventory-panel');
/**
 * open the templates project
 */
module.exports = function (browser) {

  openInventoryPanel(browser, 'Templates');

  var b;
  // generate mouse move events on body from source to destination
  browser.execute(function() {

    var title = document.body.querySelector('[data-testid^="egf_project"]');
    var bounds = title.getBoundingClientRect();
    return {left: bounds.left , top: bounds.top, width: bounds.width, height: bounds.height};

  }, [], function(result) {
    b = result.value;
    browser
    .moveToElement('body', b.left + b.width / 2, b.top + b.height / 2)
    .mouseButtonClick('right')
    .waitForElementPresent('.menu-overlay .menu-overlay-menu', 5000, 'expected an open menu');

    clickNthContextMenuItem(browser, 1);

    browser.pause(5000);
  });
};
