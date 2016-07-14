var proc = require('child_process');

var child = proc.spawn('java',['-jar', './selenium/selenium-server-standalone-2.48.2.jar']);

var env = process.argv[2] || 'default';

console.log('Running Nightwatch/Selenium Tests, ENVIRONMENT: ',env);

console.log('Started Selenium Server, PID:', child.pid);
/*
child.stdout.on('data', function (data) {
  console.log('Selenium stdout: ' + data);
});
child.stderr.on('data', function (data) {
  console.log('Selenium error: ' + data);
});
*/
child.on('close', function (code) {
  console.log('Selenium process exited with code ' + code);
});

setTimeout(function(){launchTests();}, 1000);

function launchTests(){
    var nwatch = proc.spawn('./node_modules/nightwatch/bin/nightwatch',['--env',env]);
    console.log('Started Nightwatch, PID:', nwatch.pid);
    nwatch.stdout.on('data', function (data) {
      console.log(data.toString());
    });
    nwatch.stderr.on('data', function (data) {
      console.log(data.toString());
    });
    nwatch.on('close', function (code) {
      console.log('nwatch process exited with code ' + code);
      console.log('Shutdown Server');
      child.kill();


    });
}
