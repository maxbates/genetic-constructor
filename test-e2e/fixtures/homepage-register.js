var registerViaHomepage = function (browser) {

  browser
  .url(browser.launchUrl + '/homepage')
  // wait for homepage to be present before starting
  .waitForElementPresent('.LandingPage', 5000, 'Expected homepage element to be present')
  .waitForElementPresent('#LandingPageFrame', 500, 'Expected Landing page iframe to be present')

  //trigger the modal from the frame
  .frame('LandingPageFrame', function () {
    browser
    .waitForElementPresent('.cookiesButton', 1000, 'Expected cookies button')
    .waitForElementPresent('nav .modalAction', 100, 'Expected modal action')
    .execute(function () {
      document.querySelector('.cookiesButton').click();
      document.querySelector('nav .modalAction').click();
    }, [], function () {})
    .frameParent()
    //make sure stepped out
    .assert.elementPresent('#LandingPageFrame');
  })

  // wait for login form to be present
  .waitForElementPresent('#auth-signin', 5000, 'Expected form to become visible')
  // ensure it is the sign in dialog
  .pause(1000)
  .getText('.Modal-header-title', function (result) {
    browser.assert.equal(result.value, "Sign In")
  })
  // click the a tag that switches to registration
  .click('#auth-showRegister')

  // wait for registration dialog to appear
  //.pause(2000)
  .waitForElementPresent('#auth-register', 5000, 'Expected form to become visible')

  //todo - should test and make an error pop up -- need to work around captcha
  /*
  // submit with no values to ensure errors appear
  .submitForm('#auth-register')
  //expect it to complain about there being an error
  .waitForElementPresent('.Form-errorMessage', 5000);
  */

  // create fields with viable values including a random email
  var email = 'User' + new Date().getTime() + 'blah@hotmail.com';
  var password = 'abc123';
  var firstName = 'George';
  var lastName = 'Washington';

  browser
  /*
   .clearValue('#auth-register input:nth-of-type(1)')
   .clearValue('#auth-register input:nth-of-type(2)')
   .clearValue('#auth-register input:nth-of-type(3)')
   .clearValue('#auth-register input:nth-of-type(4)')
   .clearValue('#auth-register input:nth-of-type(5)')
   .clearValue('#auth-register input:nth-of-type(6)')
   */

  //use the trick to bypass the captcha
  .setValue('#auth-register input:nth-of-type(1)', 'darwin magic')
  .pause(50)

  // "submit" using click
  .click('.Modal-action')

  //todo - need to work aconut captcha to get submit to work
  //.submitForm('#auth-register')

  //.pause(1000)
  .waitForElementNotPresent('#auth-register', 10000, 'expected form to be dismissed')
  .waitForElementPresent('.userwidget', 10000, 'expected to land on page with the user widget visible')
  //.pause(1000)
  // wait for inventory and inspector to be present to ensure we are on a project page
  .waitForElementPresent('.SidePanel.Inventory', 10000, 'Expected Inventory Groups')
  .waitForElementPresent('.SidePanel.Inspector', 10000, 'Expected Inspector')
  //.pause(1000)

  return { email, password, firstName, lastName };

}

module.exports = registerViaHomepage;
