module.exports = {
  'Sociotal test home not logged in' : function (browser) {
    browser
      .init()
      .waitForElementVisible('body', 3000)
      .assert.containsText('.form-signin h2', 'Log in')
      .pause(2000)
      .setValue('input[id=email]','test@sociotal.eu')
      .setValue('input[id=password]','test2014')
      .click('button[type=submit]')
      .waitForElementVisible('body', 3000)
      .assert.containsText('.main-content h2', 'Channels');

  },
  'Log Out' : function (browser) {
    browser
      .click('a[title=logout]')
      .waitForElementVisible('body', 3000)
      .assert.containsText('.form-signin h2', 'Log in')
      .end();

  }
};
