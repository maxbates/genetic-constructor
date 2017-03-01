/**
 * use project-set-metadata so that project is valid and can be published
 */
module.exports = function (browser) {
  browser
  .click('.ProjectHeader [data-id="Share"]')
  .waitForElementPresent('#publish-modal', 5000, 'expected publish dialog')

}
