var homepageRegister = require('../fixtures/homepage-register');
var size = require('../fixtures/size');


module.exports = {
  'Open inventory and verify all sections are present': function (browser) {
    size(browser);
    homepageRegister(browser);
    browser
      .waitForElementPresent('.SectionIcon[data-section="Templates"]', 5000, 'expected a section icon')
      .waitForElementPresent('.SectionIcon[data-section="Sketch"]', 5000, 'expected a section icon')
      //.waitForElementPresent('.SectionIcon[data-section="Commons"]', 5000, 'expected a section icon')
      .waitForElementPresent('.SectionIcon[data-section="Projects"]', 5000, 'expected a section icon')
      .waitForElementPresent('.SectionIcon[data-section="Ncbi"]', 5000, 'expected a section icon')
      .waitForElementPresent('.SectionIcon[data-section="Igem"]', 5000, 'expected a section icon')
      .waitForElementPresent('.SectionIcon[data-section="Egf"]', 5000, 'expected a section icon')
      .end();
  }
};