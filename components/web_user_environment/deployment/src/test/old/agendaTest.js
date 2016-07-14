var Agenda = require('agenda');
var agenda = new Agenda({db: { address: 'localhost:27017/agenda'}});

agenda.define('a task', function(job, done) {
  console.log("a task is running ... say hello");
  done();
});

agenda.every('1 minutes', 'test');
agenda.start();
