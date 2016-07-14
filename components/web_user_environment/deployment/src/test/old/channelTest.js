console.log("prova");
require('../../app/models/xivelyChannel');
require('../../app/models/debugChannel');
var mongoose=require('mongoose')
	, config = require('../../config/config')
	, app = require('../../server');


XivelyChannel=mongoose.model('XivelyChannel');




// console.log("**"+XivelyChannel.triggerDictionary.a);

// XivelyChannel.triggerDictionary.b=2;
c=new XivelyChannel({title:"prova_trigger", channel_type:"XivelyChannel"});



console.log(c);


c.validate(function(err){
	console.log("error validate "+err);
});

c.save( function(err){
	console.log("error");
});

// DebugChannel = mongoose.model("DebugChannel");

// console.log("debug:"+DebugChannel.triggerDictionary.b);
// console.log("xively:"+XivelyChannel.triggerDictionary.b);
// console.log("xively 2:"+c.triggerDictionary);
// c2=new DebugChannel();
// c2.doAction("consoleAction","HELLO WORLD!");
