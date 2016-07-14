var debug = require('debug')('models:trigger');
var extend = require('mongoose-schema-extend');
var mongoose = require('mongoose');
var channel = require('./channel');

var TriggerSchema = mongoose.Schema({
    class: {type : String, default : '', trim : true},
    name: String,
    label: String,
    default_value: {type : String, default : '', trim : true},
    callback: {type : Object, default : '', trim : true}
});

TriggerSchema.methods.test = function(args){
    debug(args);
};


TriggerSchema.methods.init = function(){

    // NUMERIC
    TriggerSchema.statics.triggers.push({class_name: "numeric", name:"greaterThan", label:"greater than", default_value:30,
        callback: function(num, check, negation){
            check = (check === null)? this.default_value : check;
            return ((!negation) && parseFloat(num) > parseFloat(check));
        }}
    );

    TriggerSchema.statics.triggers.push({class_name: "numeric", name:"lessThan", label:"less than", default_value:30,
        callback: function(num, check){
            check = (check === null)? this.default_value : check;
            return (parseFloat(num) < parseFloat(check));
        }}
    );

    TriggerSchema.statics.triggers.push({class_name: "numeric", name:"equalsTo", label:"equals to", default_value:0,
            callback: function(num, check, negation){
                check = (check === null)? this.default_value : check;

                if(negation){
                    return (!(parseFloat(num) == parseFloat(check)));
                } else
                    return (parseFloat(num) == parseFloat(check));


            }}
    );

    TriggerSchema.statics.triggers.push({class_name: "numeric", name:"notEqualsTo", label:"not equals to", default_value:0,
            callback: function(num, check, negation){
                check = (check === null)? this.default_value : check;

                return (!(parseFloat(num) == parseFloat(check)));


            }}
    );


    // TEXT
    TriggerSchema.statics.triggers.push({class_name: "string", name:"stringEqualsTo", label:"equals to", default_value:"",
        callback: function(text, check, negation){
            check = (check === null)? this.default_value : check;
            return ((!negation) && text == check);
        }}
    );

};

TriggerSchema.methods.getTriggerFunction = function(trigger_name){

    return TriggerSchema.statics.triggers.filter(function (item) {
        if (item.name === trigger_name){
            return  item;
        }
    });

};


TriggerSchema.methods.getTriggers = function(type) {
    debug("Searching triggers for type: " + type);

    var class_name = TriggerSchema.statics.classes.filter(function (item) {
        if (item.types.indexOf(type) > -1) {
            return item;
        } else {
            return null;
        }
    });
    if(class_name.length > 0){
        var class_type = class_name[0].name;

        var tr = TriggerSchema.statics.triggers.filter(function (item) {
            if (item.class_name === class_type)
                return  item;
        });
        debug(tr.length + " found!");
        return tr;
    } else
        return null;
};

TriggerSchema.statics = {
    classes : [
            {name: "numeric", types : ["integer", "float", "int"]},
            {name: "text", types : ["string", "char"]}
        ],
    triggers : []
};

TriggerSchema.methods.init();
//var tree = TriggerSchema.methods.getTriggers("integer");
//debug(tree);

mongoose.model('TriggerSchema', TriggerSchema);
module.exports = TriggerSchema;
