var clickText = require('./click-element-text');

var clickmenuitem = function (browser, text) {
  browser
    .waitForElementPresent('.menu-overlay .menu-overlay-menu', 5000, 'expected an open menu')
    .pause(250);
    clickText(browser, '.menu-overlay .menu-overlay-menu .menu-item .text', text);
  browser
    .waitForElementNotPresent('.menu-overlay .menu-overlay-menu', 5000, 'expected a closed menu');
};

module.exports = clickmenuitem;