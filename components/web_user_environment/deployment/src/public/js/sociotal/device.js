

function Device(){}
/**
 * Created by albe on 09/12/15.
 */

function fillDevicesCount(){
    $.getJSON( "/devices?field=count", function( count ) {
        $('#devices').text(" "+count.count);
    });
};



function search() {
    var data = {attributes: []};
    $.each($("input[name='search-attributes[]']:checked"), function () {
        data.attributes.push($(this).val());
    });
    $("#devices-container").text("");
    $.post("/devices/discovery", data, function (response) {

        response.elements.forEach(function (element) {
            $('#devices-template').tmpl(element).appendTo('#devices-container');
        });

        $("#device-container-default").text("");
        $('#devices-count').text(" "+ response.elements.length);

    });

}
function loadBubbleMembers(attrs) {
    if(attrs !== ''){
        var attrs = JSON.parse(attrs);
        var res = $.grep(attrs, function (e) { return (e.name === "BubbleEntityMembers") });
        if(res[0] !== undefined){
            $('#entities-list').val(JSON.stringify(res[0].value))
            res[0].value.forEach(function (member) {
                var element = {};
                element.member = member;
                $('#members-template').tmpl(element).appendTo('#members-container');
            });
        } else {
            $('#entities-list').val("[]")
            $('#members-container').text("Bubble not connected to any entity")
        }

    }

}

function searchForBubbles() {

    $.post("/devices/discovery", data, function (response) {

        response.elements.forEach(function (element) {
            $('#devices-template').tmpl(element).appendTo('#devices-container');
        });

        $("#device-container-default").text("");
        $('#devices').text(" "+ response.elements.length);

    });

}



// show communities during view of all devices
function listMyCommunitiesOnDevicesCreation(){
    var url = '/communities/listMyCommunities';

    $.get(url, function (response) {
        if (response.result == "success" && response.communities) {
            console.log(JSON.stringify(response.communities));

            response.communities.forEach(function(community){

                $('#myCommunities').append($('<option>', {
                    value: community.name,
                    text: community.name
                }));
            });

        }else {

        }
    });
}





// show communities during view of all devices
function listMyCommunitiesOnDevicesList(){
    var url = '/communities/listMyCommunities';

    $.get(url, function (response) {
        if (response.result == "success" && response.communities) {
            console.log(JSON.stringify(response.communities));
            loadDevices({"name":"0C"});
            response.communities.forEach(function(community){
                loadDevices(community);
                console.log(JSON.stringify(community.name));
            });

        }else {
            loadDevices({"name":"0C"});
        }
    });
}



function loadDevices(community){

    console.log("community_name :"+community.name);
    community.count = 0;
    $.getJSON("/api/devices?community_name="+community.name, function (response, status) {

        if(response ){
            $("#count").text(community.count);
            console.log("COUNT: "+community.count);
            $("devices-container-"+community.name).attr("style", "");

            if (response.devices.errorCode ) {
                community.count = Number(response.devices.errorCode.details.split(":")[1]);
                $('#community-template').tmpl(community).appendTo('#communities-container-default');
                $("#loader").hide();
                $("#devices-count").text(community.count);

                if(community.count != 0) {

                    response.devices.contextResponses.forEach(function (device) {
                        var id = device.contextElement.id;
                        var name = id.split(":")[id.split(":").length - 1];
                        device.contextElement.name = (name.length >= 25) ? name.substring(0, 15) + "..." : name;
                        device.contextElement.community_name = community.name;
                        $('#devices-template').tmpl(device.contextElement).appendTo('#devices-container-' + community.name);
                        $("#loader").hide();

                    });
                }else {
                    $('#community-template').tmpl(community).appendTo('#communities-container-default');
                }
            }else {
                $('#community-template').tmpl(community).appendTo('#communities-container-default');
            }

            //var maxItemsPage = 20;
            //
            //var total = (parseInt(count) / maxItemsPage);
            //total = (( total % 1) > 0) ? parseInt(total + 1) : parseInt(total);
            //
            //$('#paginator').bootpag({
            //  total: total,
            //  page: 1,
            //  maxVisible: total
            //}).on("page", function (event, page) {
            //
            ////$(this).bootpag({total: total, maxVisible: maxVisible});
            //}).trigger("page", 1);

        }
    });
}


function loadDevicesForBubble(community_name){
    console.log("loadDevicesForBubble");

    $.getJSON("/api/devices?community_name="+community_name, function (response, status) {
        if(response){
            var devBubble = $('#device-bubble').val()
            if(devBubble){
                var device = JSON.parse(devBubble);
                var bubbleEntityMembers = $.grep(device.attributes, function(e){ return e.name === "BubbleEntityMembers"; });

                var members = [];
                if(bubbleEntityMembers[0] !== undefined)
                    members = bubbleEntityMembers[0].value;

                response.devices.contextResponses.forEach(function (element) {
                    var context = element.contextElement;
                    if(context.type !== "urn:x-org:sociotal:resource:bubble") {
                        if ($.inArray(context.id, members) > -1) {
                            context.check = "checked";
                        } else {
                            context.check = "";
                        }
                        $('#devices-template').tmpl(context).appendTo('#devices-container');
                    }
                });
            }
        }

    });

}




function setModal(mode){
    $('#attribute-modal-mode').val('new');
    $('#metadata-counter').val(0);
    $('#metadata-container').text('');
    $('#myModal-attribute').modal('show');
}


function addMetadata(){

    var counter = parseInt($('#metadata-counter').val());
    counter = (counter == "") ? 0 : counter;
    counter++;
    $('#metadata-counter').val(counter);
    var item = {index: counter, name:"", type: "", value: ""};
    $('#metadata-form-template').tmpl(item).appendTo('#metadata-container');
}

function addAttribute(){
    var attribute = {id: guid(), name: $('#modal-attribute_name').val(),
        type: $('#modal-attribute_type').val(),
        value: $('#modal-attribute_default').val(),
        metadatas : [] }
    attribute.metadatas.lenght = 0;
    var counter = $('#metadata-counter').val();
    for(var i = 1; i<=counter; i++){
        var metadata = {name : $('#metadata_' + i + "_name").val(),
            type : $('#metadata_' + i + "_type").val(),
            value : $('#metadata_' + i + "_value").val() }
        attribute.metadatas.push(metadata);
    }

    var mode = $('#attribute-modal-mode').val();
    if(mode == 'update'){
        deleteAttribute($('#attribute-current-id').val(), false);
    }

    var attrs = $.parseJSON($('#attributes').val());
    attrs.push(attribute);
    $('#attributes').val(JSON.stringify(attrs));
    $('#myModal-attribute').modal('hide');

    listAttributes();
}

function listAttributes(){
    // alert($('#attributes').val());
    $('#attributes-list').text('');

    var attrs = $.parseJSON($('#attributes').val());
    attrs.forEach(function(attribute){
        $('#attributes-template').tmpl(attribute).appendTo('#attributes-list');
    });
}

function editAttribute(id){

    $('#myModal-attribute').modal('show');

    $('#metadata-container').text("");
    $('#attribute-modal-mode').val('update');
    $('#attribute-current-id').val(id);

    var attrs = $.parseJSON($('#attributes').val());

    var attribute = $.grep(attrs, function(e){ return e.id == id; })[0];

    // init set sensor fields
    $('#modal-attribute-id').val(id);
    $('#modal-attribute_name').val(attribute.name);
    $('#modal-attribute_type').val(attribute.type);
    $('#modal-attribute_default').val(attribute.value);

    // init metadata section
    attribute.metadatas.forEach(function(meta){
        if(meta.name != "" && meta.name != undefined){
            var counter = parseInt($('#metadata-counter').val());
            counter = (counter == "") ? 0 : counter;
            counter++;
            $('#metadata-counter').val(counter);
            meta.index = counter
            $('#metadata-form-template').tmpl(meta).appendTo('#metadata-container');
        }
    })

}

function deleteAttribute(name, refresh){
    
    var attrs = $.parseJSON($('#attributes').val());

    var attr = attrs.filter(function(item){
        return (item.name == name);
    });
    var index = attrs.indexOf(attr[0]);
    attrs.splice(index, 1);
    $('#attributes').val(JSON.stringify(attrs));

    if(refresh)
        listAttributes();
}

function saveBubble(){
    var entities = JSON.parse($('#entities-list').val());
    var communityName = $('#community_name').text()
    if(entities.length == 0){
        bootbox.alert("Bubble must have at least one entity connected");
        return;
    } else {

        var device = JSON.parse($('#device-bubble').val());
        var attributes = device.attributes;

        var membersAttribute = $.grep(attributes, function (e) { return (e.name === "BubbleEntityMembers") });
        var action = "";
        if(membersAttribute.length === 0){
            membersAttribute[0] = {
                "name": "BubbleEntityMembers",
                "value": entities,
                "type": "http://sociotal.namespace.bubble.bubbleEntityMembers"
            };
            action = "APPEND";
        } else {
            membersAttribute[0].value = entities;
            action = "UPDATE";
        }

        var data = {context : {
            type: device.type,
            id: device.id,
            community: communityName,
            attributes: membersAttribute},
            action : action,
            domain: "default"
        }

        $.ajax({
            type: "PUT",
            url: "/devices",
            contentType: "application/json",
            data: JSON.stringify(data)
        }).done(function( response ) {
            bootbox.alert("Device saved!!");
            console.log("redirect to:"+ "/devices/" + device.id + "?community_name="+communityName);
            window.location.href = "/devices/" + device.id + "?community_name="+communityName;
        });


    }
}






function saveDevice(){
    var title = $('#title').val();
    var type = $('#type').val();
    var id = $('#ID').val();
    var ownerID = $('#ownerID').val();
    var mode = "#{mode}";
    var communityName = $('#myCommunities option:selected').val();

    if(title != "" && type != "" && id != "" ){
        var attributesFromHTML = $('#attributes').val();
        var attrs =$.parseJSON(attributesFromHTML);


        for (var attr in attrs) {
            if (attrs.hasOwnProperty(attr)) {
                var id_value = attrs[attr].name+"_value";
                var value =  ($('#'+id_value).val() !== "") ? $('#'+id_value).val() : attrs[attr].value;

                if (communityName == "0C" && id_value == "Owner_value")
                    value = "none"


                attrs[attr].value = value; // update values to the json
            }
        }


        var context = {"name": $('#title').val(),
            "context_id": $('#ID').val(),
            "type": $('#type').val(),
            "community": communityName,
            "attributes": attrs,
            "domain": "default"
        };

        console.log(JSON.stringify(context));

        var data = {"context" : context, "create_channel": false};
        if(mode == "edit"){
            $.ajax({
                type: "PUT",
                url: "/devices",
                contentType: "application/json",
                data: JSON.stringify(data)
            }).done(function( response ) {
                bootbox.alert("Device saved!!");
            });

        } else {

            if(type !== 'urn:x-org:sociotal:resource:bubble') {
                bootbox.confirm("Do you want to create a new Channel for this Device?", function (result) {
                    if (result) {
                        data.create_channel = true;
                        console.log("data.create_channel = true");
                        registerDevice(data, communityName);
                    }else{
                        registerDevice(data, communityName);
                    }
                });
            }else{
                registerDevice(data, communityName);
            }
        }
    }
    else {
        $('.alert').removeClass('hidden');
        $('.alert').append("All the fields are required");
        setTimeout(function () {
            $('.alert').addClass('hidden');
            $('.alert').text('');
        }, 6000);
    }
}




function registerDevice(data, communityName){
    $.post("/devices/register", data, function (response) {
        console.log("RESPONSE DA JADE: " + JSON.stringify(response));
        console.log("data verso register: " + JSON.stringify(data));
        if (response.contextResponses != undefined) {
            console.log("è undefined");
            bootbox.alert("Warning! " + JSON.stringify(response.result) + ": " + JSON.stringify(response.response.errorCode.reasonPhrase));
        } else {
            if (type === 'urn:x-org:sociotal:resource:bubble') {
                console.log("è una bubble");
                window.location.href = '/devices/' + $('#ID').val() + '?community_name=' + communityName;
            } else {
                bootbox.alert('Device succesfully registered!', function () {
                    if (data.create_channel == true && response.channel_id != undefined){
                        console.log("RESULT data.create_channel == true && response.channel_id != undefined");
                        window.location = "/channels/" + response.channel_id
                    }else {
                        console.log("RESULT NOT data.create_channel == true && response.channel_id != undefined");
                        window.location.href = '/devices/' + $('#ID').val() + '?community_name=' + communityName;
                    }

                });
            }
        }

    }, 'json');
}

function handleEntity(cb) {
    var entities = $('#entities-list').val();
    entities = (entities !== "") ? JSON.parse($('#entities-list').val()) : [];

    var entity = cb.value;

    var idx = $.inArray(entity, entities);
    if (idx == -1) {
        entities.push(entity);
    } else {
        entities.splice(idx, 1);
    }

    $('#entities-list').val(JSON.stringify(entities));

}



//function loadTemplates(){
//var templates = [{"name":"WeatherStation"}, {"name":"Smartphone"}, {"name":"Bubble"} ];
//templates.forEach(function(template){
//    $("#device-template-type").append('<option value="' + template.name + '">' + template.name +  '</option>')
//});

//}

//function loadTemplatesV2(){
//  var t ={"name":"Blank","type":"blank"}
//  $('#templates-item').tmpl(t).appendTo('#templates-box');
//  var templates = $.parseJSON($('#templates-obj').val());
//  templates.forEach(function(template){
//    $('#templates-item').tmpl(template).appendTo('#templates-box');
//  });
//
//}

//function loadTemplatesAttributes(){
//  var templates = $.parseJSON($('#templates-obj').val());
//  templates.forEach(function(template){
//    $('#templates-item-attribute').tmpl(template.attributes).appendTo('#templates-box-attributes');
//  });
//}


function selectEntities(id) {
    var device_list_obj = $.parseJSON($('#templates-entities').val());
    var entityList = $.parseJSON($('#entities').val());

    device_list_obj.forEach(function(entity){

        if(entity.id == id){
            console.log(entity);
            entityList.push(entity);
            $('#entities-template').tmpl(entity).appendTo('#entities-list');
            $('#entities').val(JSON.stringify(entityList));
            console.log(JSON.stringify(entityList));
            $('#myModal-entity').modal('hide');
        }

    });


    console.log(device_list_obj);
}


function selectAttributes(name){
    var templateAttributes = $.parseJSON($('#templates-attributes').val());
    var attributeList = $.parseJSON($('#attributes').val());


    templateAttributes.forEach(function(attribute){

        if(attribute.name == name){
            console.log(attribute);
            attributeList.push(attribute);
            $('#attributes-template').tmpl(attribute).appendTo('#attributes-list');
            $('#attributes').val(JSON.stringify(attributeList));
            console.log(JSON.stringify(attributeList));
            $('#myModal-attribute').modal('hide');
        }

    });


    //
    //
    //
    //templates.forEach(function(template){
    //  template.attributes.filter(function(attribute){
    //
    //    if(attribute.name == name){
    //
    //      console.log(name);
    //
    //
    //      //alert(JSON.stringify(attribute));
    //      /*
    //       //type = type.slice(0,type.lastIndexOf(':'));   //// we remove the weatherstation or smartphone name here to leave only urn:x-org:sociotal:resource:device
    //
    //       $('#type').val(type);
    //
    //
    //       var attrs = template.attributes;
    //       $('#attributes-list').text('');
    //       attrs.forEach(function(attribute){
    //       attribute.id = guid();
    //       $('#attributes-template').tmpl(attribute).appendTo('#attributes-list');
    //       });
    //       */
    //
    //      attrs.push(attribute);
    //      $('#attributes-template').tmpl(attribute).appendTo('#attributes-list');
    //      $('#attributes').val(JSON.stringify(attrs));
    //      $('#myModal-attribute').modal('hide');
    //
    //    }
    //
    //  });
    //})


}

function loadTemplateV2(type){
    var templates = $.parseJSON($('#templates-obj').val());
    console.log(type);


    // if(type.toLowerCase() == "urn:x-org:sociotal:resource:bubble" || type.toLowerCase() == "blank") {
    $('#new_attribute_button').show();
    //     console.log("bubble");
    // }
    // if (type.toLowerCase() != "urn:x-org:sociotal:resource:bubble" && type.toLowerCase() != "blank")   {
    //     $('#new_attribute_button').hide();
    //     console.log("non bubble");
    // }
    //

    if(type != "blank")

        templates.filter(function(template){


            if(template.type == type){

                //type = type.slice(0,type.lastIndexOf(':'));   //// we remove the weatherstation or smartphone name here to leave only urn:x-org:sociotal:resource:device

                $('#type').val(type);
                $('#project').val(template.project);
                $('#deployment').val(template.deployment);


                var attrs = template.attributes;
                $('#attributes-list').text('');
                attrs.forEach(function(attribute){
                    attribute.id = guid();
                    $('#attributes-template').tmpl(attribute).appendTo('#attributes-list');
                });
                $('#attributes').val(JSON.stringify(attrs));

            }
        });
    else{
        $('#type').val("undefined");
    }

    $('#templates').modal('hide');

}
function createID(){

    var parts = $('#type').val().split(':');   //last string of type just to keep only the typename
    var type_substring = parts[parts.length - 1];

    var id = $('#project').val() + ":" +  $('#deployment').val() + ":" +  type_substring + ":" + $('#title').val().replace(" ", "_")
    $('#ID').val(id);
}



function deleteDevice(id, communityName){
    bootbox.confirm("Are you sure to delete this Device? Please notice: linked Channels will NOT be deleted. ", function (result) {
        if (result) {
            var data = {
                type: $('#type').val(),
                community_name : communityName,
            }
            $.ajax({
                url: '/devices/' + id,
                type: 'DELETE',
                data: data,
                success: function (response) {
                    if (response.success) {

                        bootbox.dialog({
                            message: "Device deleted!",
                            title: "Device successfully deleted.",
                            buttons: {
                                success: {
                                    label: "Ok",
                                    className: "btn-success",
                                    callback: function() {
                                        window.location.href = '/devices';
                                    }
                                }
                            }});

                        //
                        // bootbox.alert('Device deleted!', function () {
                        //     window.location.href = '/devices';
                        // });

                    }else {
                        // bootbox.alert('Cannot delete this device!! Are you authorized? ', function () {
                        //     window.location.href = '/devices/' + id;
                        // });

                        bootbox.dialog({
                            message: "Cannot delete this device. You are unauthorized. ",
                            title: "Warning",
                            buttons: {
                                success: {
                                    label: "Close",
                                    className: "btn-danger",
                                    callback: function() {
                                        window.location.href = '/devices/'+ id;
                                    }
                                }
                            }});

                    }
                }
            });
        }
    });
}

function getUserInfoByID(){
    $.getJSON( "/communities/getUserInfoByID/", function( count ) {
        $('#devices').text(count.count);
    });

};


var guid = (function() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }
    return function() {
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
    };
})();
