
/**
 * Module dependencies.
 */

var mongoose = require('mongoose')
  , should = require('should')
  , request = require('supertest')
  , app = require('../../server')
  , context = describe
  , User = mongoose.model('User')
  , Article = mongoose.model('Article')
  , agent = request.agent(app)

var count

/**
 * Articles tests
 */

describe('Articles', function () {
  before(function (done) {
    // create a user
    var user = new User({
      email: 'foobar@example.com',
      name: 'Foo bar',
      username: 'foobar',
      password: 'foobar'
    })
    user.save(done)
  })

  describe('GET /channels', function () {
    it('should respond with Content-Type text/html', function (done) {
      agent
      .get('/channels')
      .expect('Content-Type', /html/)
      .expect(200)
      .expect(/Articles/)
      .end(done)
    })
  })

  describe('GET /channels/new', function () {
    context('When not logged in', function () {
      it('should redirect to /login', function (done) {
        agent
        .get('/channels/new')
        .expect('Content-Type', /plain/)
        .expect(302)
        .expect('Location', '/login')
        .expect(/Moved Temporarily/)
        .end(done)
      })
    })

    context('When logged in', function () {
      before(function (done) {
        // login the user
        agent
        .post('/users/session')
        .field('email', 'foobar@example.com')
        .field('password', 'foobar')
        .end(done)
      })

      it('should respond with Content-Type text/html', function (done) {
        agent
        .get('/channels/new')
        .expect('Content-Type', /html/)
        .expect(200)
        .expect(/New Article/)
        .end(done)
      })
    })
  })

  describe('POST /channels', function () {
    context('When not logged in', function () {
      it('should redirect to /login', function (done) {
        request(app)
        .get('/channels/new')
        .expect('Content-Type', /plain/)
        .expect(302)
        .expect('Location', '/login')
        .expect(/Moved Temporarily/)
        .end(done)
      })
    })

    context('When logged in', function () {
      before(function (done) {
        // login the user
        agent
        .post('/users/session')
        .field('email', 'foobar@example.com')
        .field('password', 'foobar')
        .end(done)
      })

      describe('Invalid parameters', function () {
        before(function (done) {
          Article.count(function (err, cnt) {
            count = cnt
            done()
          })
        })

        it('should respond with error', function (done) {
          agent
          .post('/channels')
          .field('title', '')
          .field('body', 'foo')
          .expect('Content-Type', /html/)
          .expect(200)
          .expect(/Article title cannot be blank/)
          .end(done)
        })

        it('should not save to the database', function (done) {
          Article.count(function (err, cnt) {
            count.should.equal(cnt)
            done()
          })
        })
      })

      describe('Valid parameters', function () {
        before(function (done) {
          Article.count(function (err, cnt) {
            count = cnt
            done()
          })
        })

        it('should redirect to the new channel page', function (done) {
          agent
          .post('/channels')
          .field('title', 'foo')
          .field('body', 'bar')
          .expect('Content-Type', /plain/)
          .expect('Location', /\/channels\//)
          .expect(302)
          .expect(/Moved Temporarily/)
          .end(done)
        })

        it('should insert a record to the database', function (done) {
          Article.count(function (err, cnt) {
            cnt.should.equal(count + 1)
            done()
          })
        })

        it('should save the channel to the database', function (done) {
          Article
          .findOne({ title: 'foo'})
          .populate('user')
          .exec(function (err, channel) {
            should.not.exist(err)
            channel.should.be.an.instanceOf(Article)
            channel.title.should.equal('foo')
            channel.body.should.equal('bar')
            channel.user.email.should.equal('foobar@example.com')
            channel.user.name.should.equal('Foo bar')
            done()
          })
        })
      })
    })
  })

  after(function (done) {
    require('./helper').clearDb(done)
  })
})
