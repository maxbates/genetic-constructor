var myProjects = require('./myprojects.js');


var openTemplatesSample = function(browser) {
  myProjects(browser);
  browser.elements('css selector', '[data-inventory~="project"]', function (resultValues) {
    resultValues.value.forEach(function(element) {
      browser.elementIdText(element.ELEMENT, function (result) {
        if(result.value === 'EGF Sample Templates') {
          browser.moveTo(element.ELEMENT, 0,0 , function () {
            browser.elementIdClick(element.ELEMENT, function (clicked) {
              browser
                .pause(10000)
                .waitForElementPresent('[data-nodetype="block"]', 5000, 'expected blocks to appear')
                .assert.countelements('.construct-viewer', 29);
            });
          });
        }
      });
    });
  });
}

module.exports = openTemplatesSample;
