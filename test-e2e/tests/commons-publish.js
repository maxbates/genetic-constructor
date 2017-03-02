var uuid = require('uuid');

var homepageRegister = require('../fixtures/homepage-register');
var size = require('../fixtures/size');
var testProject = require('../fixtures/testproject');
var projectSetMetadata = require('../fixtures/project-set-metadata');
var publishProject = require('../fixtures/publish-given-project');

module.exports = {
  'Test publishing a project to the commons': function (browser) {
    size(browser);

    homepageRegister(browser, function (browser, publisherCredentials) {
      testProject(browser);
      projectSetMetadata(browser, {}, function (browser, publishedProject) {
        publishProject(browser, publishedProject, function (browser) {
          browser.end();
        });
      });
    });
  }
};
