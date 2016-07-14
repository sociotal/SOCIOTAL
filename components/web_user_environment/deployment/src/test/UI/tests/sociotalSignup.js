module.exports = {
  'Sociotal test home not logged in' : function (browser) {
    browser
      .init()
      .waitForElementVisible('body', 3000)
      .assert.containsText('.form-signin h2', 'Log in');

  },

  'Choose Sign Up':  function (browser) {
    browser
      .click('.show-signup')
      .waitForElementVisible('body', 3000)
      .assert.containsText('.form-signin h2', 'Sign up')
      .end();
    }

};
