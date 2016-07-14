function Connection(){}

function setModalMode(mode){
    $('#modal-mode').val(mode);
}

function openConnectionModal(mode){
    //$('#modal-mode').val(mode);
    $('#modal-connection').modal('show');
    var channel_type = $( "#channelType").val();
    //alert(channel_type);
    //if(channel_type == "SocIoTalChannel"){
    //    prepareAttributesDropdown();
    //}


    //if(channel_type === "XivelyChannel"){}
    //    loadTriggers();

}

function prepareAttributesDropdown(){
    var attributes = $.parseJSON($('#attributes').val());
    $('#attribute-name').text('');
    $('#attribute-name').append("<option>Select an attribute...</option>");
    attributes.forEach(function(attribute){
        $('#attribute-name').append("<option>" + attribute.name + "</option>");
    });
}

function changeDefautlValue(el, mode){
    var def, default_value;

    switch (mode){
        case "trigger":
            var arr = $.parseJSON($('#channelTriggers').val());
            var obj = $.grep(arr, function(e){ return e.id == el.value; })[0];
            def = obj.default;

            default_value = "modal-trigger-val";
            break;

        case "action":
            var arr = $.parseJSON($('#actionChannels').val());
            var obj = $.grep(arr, function(e){ return e.id == el.value; })[0];
            def = (obj) ? obj.default : "none";
            default_value = "modal-action-val";
            break;
    }


    if (def != "none"){
        $('#' + default_value).val(def);
        $('#' + default_value).show();
    } else
        $('#' + default_value).hide();
}

function showChannelActions(channelId){
    if(channelId){
        var chs = $.parseJSON($('#targetChannels').val());
        var targetChannel = $.grep(chs, function(e){ return e.id == channelId; })[0];

        // remove all options from select element
        $("#action-name").children().remove().end();
        $('#actionChannels').val(JSON.stringify(targetChannel.actionShow));
        $("#action-name").append('<option value="none">select an action...</option>')
        targetChannel.actionShow.forEach(function(action) {
            $("#action-name").append('<option value="' + action.id + '">' + action.label +  '</option>')
        });

        $('#targetChannelId').val(targetChannel.id);
        $('#targetChannelName').val(targetChannel.title);
        $('#action-row').show();
    } else
        $('#action-row').hide();
}



function loadTriggers(attribute_name, callback){  // callback is optional parameter
    console.log("attribute_name "+attribute_name);

    if(attribute_name !== undefined){
        var attributes = $.parseJSON($('#attributes').val());
        console.log("attributes "+JSON.stringify(attributes));

        var attribute = attributes.filter(function (item) {
            if (item.name === attribute_name)
                return  item;
        });

        var attr_type = attribute[0].type;
        var selected_attribute = attribute[0];

        console.log("attr_type: "+attr_type);
        console.log("attribute_name: "+attribute[0].name);
        console.log("attribute selected is: "+JSON.stringify(selected_attribute));

        var types = ['integer', 'int', 'float'];
        if(types.indexOf(attr_type) == -1){

            console.log(JSON.stringify("ECCO I METADATAS: "+ JSON.stringify(selected_attribute.metadatas)));
            //
            // selected_attribute.metadatas.forEach(function(metadata){
            //
            //     console.log("metadata is: "+JSON.stringify(metadata));
            // });

            selected_attribute.metadatas.filter(function (item) {
                if (item.name == "DataDescription"){
                    attr_type = item.value;
                    console.log("attr_type is now: "+attr_type);
                }
            });
        }
    } else {
        attr_type = 'float';
    }

    var channelId = $('#channelId').val();

    $.getJSON("/channels/" + channelId + "/triggers/"+ attr_type, function (triggers) {
        $("#trigger-name").children().remove().end();
        $("#trigger-name").append('<option value="none">select a trigger...</option>')
        triggers.forEach(function(trigger) {
            $("#trigger-name").append('<option value="' + trigger.name + '">' + trigger.label +  '</option>')
        });

        if(callback !== undefined)
            callback();

        $('#triggers-row').show();
    });
    $('#trigger-value').val('');
}




function checkValueType(triggerName, callback){  // callback is optional parameter

    console.log(triggerName)
}


function buildConnection(){
    var triggerAttribute, triggerName, triggerCheck;
    var actionTargetChannelId, actionTargetChannelName, actionArg

    var channelType = $( "#channelType").val();

    switch (channelType){
        case "XivelyChannel":
            triggerAttribute = $('#channelTitle').val();

            break;
        case "SocIoTalChannel":
            triggerAttribute = $('#attribute-name').val();
            break;
    }

    triggerName = $('#trigger-name').val();
    triggerCheck = $('#trigger-value').val();

    actionTargetChannelId = $('#targetChannelId').val();
    actionTargetChannelName = $('#targetChannelName').val();
    actionTargetFunctionName = $('#action-name').val();
    actionArg =  $('#action-value').val();


    var label = "WHEN " +
                triggerAttribute + " " +
                $('#trigger-name > option:selected').text() + " " +
                triggerCheck + " " +
                "DO " +
                actionTargetChannelName + "." +
                actionTargetFunctionName + "(" + triggerCheck + ")";

    return {    "name":   $('#modal-name').val(),
                "trigger" : {   attribute: triggerAttribute,
                                negation: '',
                                name: triggerName,
                                check: triggerCheck
                            },
                "action"  : {   targetChannelId: actionTargetChannelId ,
                                targetChannelName: actionTargetChannelName,
                                actionName: actionTargetFunctionName,
                                arg: actionArg
                },
                "label" : label }
}


Connection.prototype = {
    constructor: Connection,

    list: function(id) {
        var channelType = $( "#channelType").val();
        $.getJSON("/channels/" + id + "/connections", function (response) {
            if (response.success) {
                if(response.data.length > 0){
                    $("#connections-list").children().remove();
                    response.data.forEach(function (item) {

                        var label = item.label.split(" ");
                        item.lab1 = label[1];
                        item.lab2 = label[2] + " " + label[3] + " " + label[4];
                        var conn = {connection : item};
                        $('#connection-template').tmpl(conn).appendTo('#connections-list');
                    });
                    $('#connections').val(JSON.stringify(response.data));

                    $('#connections-list').show();
                    $('#connections-empty').hide();
                } else {
                    $('#connections-empty').show();
                    $('#connections-list').hide();
                }

            }
        });
    },

    delete: function (connectionId) {
        var data = {_csrf: $('#_csrf').val()};
        var self = this;
        bootbox.confirm("Are you sure to delete this Connection?", function (result) {

            if (result) {
                $.ajax({
                    url: '/channels/' + $('#channelId').val() + '/connections/' + connectionId,
                    type: 'DELETE',
                    data: data,
                    success: function (response) {
                        if (response.result == 'success') {
                            self.list(response.channelId);
                        }
                    }
                });
            }
        });
    },

    edit: function(id){
        $('#modal-connection').modal('show');
        var channelType = $( "#channelType").val();

        if(channelType == "SocIoTalChannel")
            prepareAttributesDropdown();

        var conns = $.parseJSON($('#connections').val());
        var connection = $.grep(conns, function(e){ return e._id == id; })[0];

        $('#modal-connection-id').val(id);
        $('#attribute-name').val(connection.trigger.attribute);
        var attribute = undefined;
        if(channelType == "SocIoTalChannel")
            attribute = connection.trigger.attribute;

        loadTriggers(attribute, function(){
            $('#trigger-name').val(connection.trigger.name);
            $('#trigger-value').val(connection.trigger.check);
        });


        // in channels dropdown select the option with value == targetChannelId
        $('#target-channels').val(connection.action.targetChannelId);

        // generate and show actions for channel selected
        showChannelActions(connection.action.targetChannelId);
        $('#action-name').val(connection.action.actionName);
        $('#action-value').val(connection.action.arg).show();

        $('#modal-mode').val("update");
    },

    save: function(){

        var mode = $('#modal-mode').val();
        // _csrf: token for authentication
        var data = { mode: mode, _csrf: $('#_csrf').val(), connection : buildConnection() }
        if(mode == "update")
            data.connectionId = $('#modal-connection-id').val();

        var channelId =  $('#channelId').val();
        var self = this;
        $.post('/channels/' + channelId + '/connections', data, function( response ) {
            if(response.result == "success"){
                //bootbox.alert("Connection saved!");
                self.list(response.channelId);
                $('#modal-connection').modal('hide');
            } else {
                bootbox.alert("Error: Connection not saved!");
            }
        });

    }


};