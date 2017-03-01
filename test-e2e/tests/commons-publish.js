var homepageRegister = require('../fixtures/homepage-register');
var size = require('../fixtures/size');
var testProject = require('../fixtures/testproject');
var openInventoryPanel = require('../fixtures/open-inventory-panel');
var projectSetMetadata = require('../fixtures/project-set-metadata');
var publishProject = require('../fixtures/publish-project');

var rightClickAt = require('../fixtures/rightClickAt');
var clickMenuNthItem = require('../fixtures/click-popmenu-nth-item');

module.exports = {
  'Test publishing a project to the commons': function (browser) {

    var projectName = 'My Great Project';

    size(browser);
    homepageRegister(browser);
    openInventoryPanel(browser, 'Projects');

    testProject(browser);

    projectSetMetadata(browser, projectName);

    publishProject(browser);
  }
};
