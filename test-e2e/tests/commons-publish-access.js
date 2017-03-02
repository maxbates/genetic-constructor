/*
 Copyright 2016 Autodesk,Inc.

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

var uuid = require('uuid');
var invariant = require('invariant');
var _ = require('lodash');

var homepageRegister = require('../fixtures/homepage-register');
var size = require('../fixtures/size');
var testProject = require('../fixtures/testproject');
var openInventoryPanel = require('../fixtures/open-inventory-panel');
var projectSetMetadata = require('../fixtures/project-set-metadata');
var publishProject = require('../fixtures/publish-given-project');
var getProjectRollup = require('../fixtures/get-project-rollup');
var signout = require('../fixtures/signout');
var rightClickAt = require('../fixtures/rightClickAt');
var clickContextMenu = require('../fixtures/click-popmenu-nth-item.js');

module.exports = {
  'Test publishing a project to the commons': function (browser) {
    size(browser);

    homepageRegister(browser, function (browser, publisherCredentials) {
      testProject(browser);
      projectSetMetadata(browser, {}, function (browser, publishedProject) {
        publishProject(browser, publishedProject, function (browser) {

          //now, sign in as new user and access it
          signout(browser);
          homepageRegister(browser, function (browser, accessorCredentials) {
            console.log('accessing ' + publishedProject.id);

            invariant(accessorCredentials.email !== publisherCredentials.email, 'should have new email');

            openInventoryPanel(browser, 'Commons');

            var treeSelector = '[data-testid="commons/' + publishedProject.owner + '"]';
            var projectSelector = '[data-testid="commons/' + publishedProject.owner + '/' + publishedProject.id + '"]';
            var projectOpenSelector = '[data-testid="commonsopen/' + publishedProject.id + '"]';

            browser
            .waitForElementPresent('.InventoryGroupCommons', 5000, 'commons should appear')
            .waitForElementPresent(treeSelector, 5000, 'users list of commons projects should appear')
            .click(treeSelector)
            .waitForElementPresent(projectSelector, 5000, 'published project should appear');
            //.click(projectOpenSelector)

            rightClickAt(browser, projectSelector, 30, 15);
            clickContextMenu(browser, 1);

            browser
            .waitForElementPresent('[data-testid="ProjectHeader/' + publishedProject.id + '"]', 10000, 'expected to open project')
            .assert.countelements('.construct-viewer', publishedProject.components.length)
            .assert.countelements('.construct-viewer [data-id="Locked"]', publishedProject.components.length);

            getProjectRollup(browser, function (browser, rollup) {
              invariant(rollup.project.rules.frozen, 'project should be frozen');
              invariant(_.every(rollup.blocks, block => block.rules.frozen), 'all blocks should be frozen');

              browser.end();

              // todo (future) - drag one into project
            });
          });
        });
      });
    });
  }
};