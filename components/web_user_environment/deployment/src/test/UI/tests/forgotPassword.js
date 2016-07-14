module.exports = {
  'Sociotal test home not logged in' : function (browser) {
    browser
      .init()
      .waitForElementVisible('body', 3000)
      .assert.containsText('.form-signin h2', 'Log in');

  },

  'Choose Forgot your Password?':  function (browser) {
    browser
      .click('a[href$=forgot]')
      .waitForElementVisible('body', 3000)
      .assert.containsText('.form-signin h2', 'Forgot password?')
      .end();
    }

};
