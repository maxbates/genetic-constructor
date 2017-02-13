var homepageRegister = require('../fixtures/homepage-register');
var size = require('../fixtures/size');
var openInspectorPanel = require('../fixtures/open-inspector-panel');
var testProject = require('../fixtures/testproject');

module.exports = {
  'Open the color picker on a block': function (browser) {
    size(browser);
    homepageRegister(browser);
    testProject(browser);
    openInspectorPanel(browser, 'Information');
    browser
    .pause(3000)
    .click('.node[data-nodetype="block"]')
    .waitForElementPresent('.SBOLPicker', 1000, 'expected a symbol picker')
    .click('.SBOLPicker')
    .waitForElementPresent('.SBOLPicker .dropdown')
    .assert.countelements('.SBOLPicker .RoleSvg', 15)
    .end();
  },
};
