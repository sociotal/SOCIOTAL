require('../../app/models/xivelyChannel');
require('../../app/models/debugChannel');
var mongoose=require('mongoose')
	, config = require('../../config/config')
	, app = require('../../server');

XivelyChannel=mongoose.model('XivelyChannel');
DebugChannel = mongoose.model("DebugChannel");







var x1=new XivelyChannel({title:"AAA", channel_type:"XivelyChannel"});
var d=new DebugChannel({title:"BBB", channel_type:"DebugChannel"});


console.log(x1);

x1.addConnection({
		  name:"Aconnection",
		  trigger:{name:"lowPassTrigger", check:20 },
		  action:{targetChannelId: d._id, actionName:"doAction", arg:"Test!"}
		});

console.log(x1);

x1.save();
