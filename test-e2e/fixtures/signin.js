var signin = function (browser, credentials) {

  browser
  // sign back in with previous credentials
  .waitForElementPresent('.LandingPage', 5000, 'sign in can occur on the homepage only')
  .waitForElementPresent('#LandingPageFrame', 500, 'Expected Landing page iframe to be present')

  //trigger the modal from the frame
  .frame('LandingPageFrame', function () {
    browser
    .waitForElementPresent('nav .modalAction', 100, 'Expected modal action')
    .execute(function () {
      //may not be present
      var cookieModal = document.querySelector('.cookiesButton');
      if (cookieModal) {
        cookieModal.click()
      }

      document.querySelector('nav .modalAction').click();
    }, [], function () {})
    .frameParent()
    //make sure stepped out
    .assert.elementPresent('#LandingPageFrame');
  })
  .waitForElementPresent('#auth-signin', 5000, 'Expected sign in dialog to become visible')

    /*
  //todo - submit and test for errors
  // try submitting with no credentials
  .submitForm('#auth-signin')
  // expect 1 error, missing credentials
  .waitForElementPresent('.error.visible', 5000, 'expect error to become visible')
  .assert.countelements('.error.visible', 1)
  // try with bad credentials
  .clearValue('#auth-signin input:nth-of-type(1)')
  .setValue('#auth-signin input:nth-of-type(1)', 'billgates@microsoft.com')
  .clearValue('#auth-signin input:nth-of-type(2)')
  .setValue('#auth-signin input:nth-of-type(2)', credentials.password)
  .submitForm('#auth-signin')
  // expect 1 error, bad credentials
  .waitForElementPresent('.error.visible', 5000, 'expect error to appear')
  .assert.countelements('.error.visible', 1)
  // try correct credentials
  .clearValue('#auth-signin input:nth-of-type(1)')
  .setValue('#auth-signin input:nth-of-type(1)', credentials.email)
  .submitForm('#auth-signin')
  */
  .setValue('#auth-signin input[name="email"]', credentials.email)
  .setValue('#auth-signin input[name="password"]', credentials.password)
  .pause(100)
  .click('.Modal-action')
  .waitForElementNotPresent('#auth-signin', 5000, 'form should be dismissed on successful login');
};

module.exports = signin;
