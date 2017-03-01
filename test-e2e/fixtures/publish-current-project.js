/**
 * use project-set-metadata so that project is valid and can be published
 */
module.exports = function (browser) {
  browser
  .click('.ProjectHeader [data-id="Share"]')
  .waitForElementPresent('.PublishModal', 5000, 'expected publish dialog')
  .waitForElementPresent('button.Modal-action', 5000, 'expected publish dialog')
  .pause(100)
  .click('button.Modal-action')
  .waitForElementNotPresent('#publish-modal', 5000, 'expected dialog to disappear')

}
