const signout = function(browser) {
  // NOTE: This only works if currently signed in
  browser
    .waitForElementPresent('.ribbongrunt-hidden', 5000, 'expected ribbon to go away')
    .pause(500)
    // click user widget to start sign out
    .waitForElementPresent('.userwidget', 5000, 'expected user to be signed in')
    .click('.userwidget')
    // click sign out menu item
    .waitForElementPresent('.menu-item:nth-of-type(3)', 5000, 'expected menu to appear')
    .pause(1000)
    .click('.menu-item:nth-of-type(3)')
    .waitForElementPresent('.LandingPage', 5000, 'expected to be signed out')
}

module.exports = signout;
