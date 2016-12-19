var clickcontextmenu = function(browser, index) {
  browser
    .waitForElementPresent('.menu-overlay .menu-overlay-menu', 5000, 'expected an open menu')
    .pause(250)
    .click('.menu-overlay .menu-overlay-menu .menu-item:nth-of-type(' + index + ')')
    .waitForElementNotPresent('.menu-overlay .menu-overlay-menu', 5000, 'expected a closed menu')
};

module.exports = clickcontextmenu;
