var homepageRegister = require('../fixtures/homepage-register');
var newProject = require('../fixtures/newproject');
var rightClickAt = require('../fixtures/rightClickAt');
var size = require('../fixtures/size');
var openConstructViewerContextMenu = require('../fixtures/open-construct-viewer-context-menu');
var clickNthContextMenuItem = require('../fixtures/click-popmenu-nth-item');

module.exports = {
  'Delete a construct from the context menu.' : function (browser) {
    size(browser);

    // register via fixture
    homepageRegister(browser);

    // new project single construct
    newProject(browser);

    // delete block from second construct viewer
    openConstructViewerContextMenu(browser);
    clickNthContextMenuItem(browser, 2);

    browser
    .waitForElementNotPresent('.construct-viewer', 5000, 'expect construct to be deleted')
    .end();
  }
};
