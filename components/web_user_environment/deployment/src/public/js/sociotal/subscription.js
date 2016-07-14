function Subscription(){}


function createDropDown(id, elements){
    $('#' + id + ' option').each(function() {
        $(this).remove();
    });

    $('#' + id).append('<option value="none">Select an item</option>');
    $.each(elements, function (i, el) {
        $('#' + id).append("<option>" + el + "</option>");
    });

}

function showCondition(el){

    if($('#' + el.id).val() == 'ONTIMEINTERVAL'){
        $('#modal-condvalues-attr-box').hide()
        $('#modal-condvalues-intervall-box').show()
    }
    if($('#' + el.id).val() == 'ONCHANGE'){
        $('#modal-condvalues-attr-box').show()
        $('#modal-condvalues-intervall-box').hide()
    }

}

Subscription.prototype = {
    constructor: Subscription,

    listAll: function(id){
        $.getJSON( "/channels/" + id + "/subscriptions" , function( response ) {
            if(response.success){
                $("#subscription-list").children().remove();
                response.data.forEach(function(item) {
                    $('#subscription-template').tmpl(item).appendTo('#subscription-list');
                });
                //$('#subscriptions').val(JSON.stringify(response.data));
            }
        });
    },

    delete: function(sensorId){
        var data = {_csrf: $('#_csrf').val()}
        bootbox.confirm("Are you sure to delete this sensor?", function(result){
            if(result){
                $.ajax({
                    url: '/channels/' + $('#channelId').val() + '/sensors/' + sensorId,
                    type: 'DELETE',
                    data: data,
                    success: function(response) {
                        if(response.result == 'success'){
                            bootbox.alert('Sensor deleted!');
                            new Sensor().listAll(response.channelId);
                        }
                    }
                });
            }
        });
    },

    save: function (){
        $('#sensor-form').submit(function(){
            $.post($(this).attr('action'), $(this).serialize(), function(response) {
                if(response.result == "success"){
                    bootbox.alert("Sensor saved!");
                    new Sensor().listAll(response.channelId);
                    $('#myModal-sensor').modal('hide');
                } else {
                    bootbox.alert("Error!! Sensor not saved!");
                }
            }, 'json');
            $(this).unbind('submit')
            return false;
        });
    },

     prepareSubscriptionModal: function(){
        var id = $('#modal-sub-attribute-id').val();
        var attrs_names = [];
        var attrs = $.parseJSON($('#attributes').val());

        $('#modal-sub-attributes').text('');
        $('#modal-sub-condition-attribute').text('');
        attrs.forEach(function(attribute){
            //alert(attribute.name);
            $('#attributes-checkbox-template').tmpl(attribute).appendTo('#modal-sub-attributes');
            $('#attributes-condition-checkbox-template').tmpl(attribute).appendTo('#modal-sub-condition-attribute');
        });

        //$.each(attrs, function (i, el) {
        //    attrs_names.push(el.name);
        //});
        //createDropDown('modal-sub-attributes', attrs_names)
        //createDropDown('modal-sub-condition-attribute', attrs_names)

        var types = ['ONCHANGE', 'ONTIMEINTERVAL'];
        createDropDown('modal-sub-types', types)

        //var durations = ['P1M', 'P2M'];
        //createDropDown('modal-sub-durations', durations)


        var intervalls = ['PT5S', 'PT10S', 'PT15S'];
        createDropDown('modal-cond-values-intervall', intervalls)

        $('#modal-condvalues-attr-box').hide()
        $('#modal-condvalues-intervall-box').hide()
    },



     subscribe: function(){

        var duration = 'P1M';
        var attributes = [];
        var condition_value = [];
        var id = $('#modal-sub-sensor-id').val();

        $.each($("input[name='subscription-attributes[]']:checked"), function() {
            attributes.push($(this).val());
        });

        var condition_type = $('#modal-sub-types').val();
        var condition_intervall = $('#modal-cond-values-intervall').val();

        if(condition_type == "ONTIMEINTERVAL")
            condition_value = condition_intervall

        if(condition_type == "ONCHANGE"){
            $.each($("input[name='subscription-condition-attributes[]']:checked"), function() {
                condition_value.push($(this).val());
            });
        }

        var data = {
            context_id: id,
            duration: duration,
            attributes: attributes,
            condition_type: condition_type,
            condition_value: condition_value
        };
         //alert(JSON.stringify(data));

         bootbox.confirm("Are you sure to subscribe the channel?", function(result){
            if(result){
                $('#loading-indicator').show();
                $.post( "/channels/" + channel_id + "/subscribe", data, function( response ) {
                    if(response.success){

                        new Subscription().listAll(response.channelId);
                        // $('#button-unsub').show();
                        // $('#button-sub').hide();

                        $('#run-status').text('Subscription active...   ');
                        setTimeout(function(){
                            $('#run-status').text('');
                        }, 4000);
                    } else{
                        bootbox.alert(response.message);
                    }
                    $('#myModal-subscription').modal('hide');
                    $('#loading-indicator').hide();
                });
            }
        });
    },


    unsubscribe: function(subscription_id){
        var channel_id = $('#channelId').val();
        bootbox.confirm("Are you sure to unsubscribe the channel?", function(result){
            if(result){
                $.getJSON( "/channels/" + channel_id + "/unsubscribe/?subid=" + subscription_id, function( response ) {
                    new Subscription().listAll(response.channelId);
                });
            }
        });
    },


    easySubscribe: function(){
        bootbox.confirm("Are you sure you want to subscribe this Channel to gather data?", function(result){
            if(result){
                var attributes = [];
                var id = $('#context_id').val();
                var contextType = $('#context_type').val();
                var channel_id = $('#channelId').val();
                var community_name = $('#community_name').val();

                if($('#attributes').val() != 'undefined'){
                    var attrs = JSON.parse($('#attributes').val());
                    attrs.forEach(function(attr){
                        attributes.push(attr.name);
                    });

                    var data = {
                        context_id: id,
                        context_type: contextType,
                        community_name: community_name,
                        duration: 'P1M',
                        //attributes: attributes,
                        condition_type: "ONCHANGE",
                        condition_value: attributes,
                        easy: true
                    };

                    $.post( "/channels/" + channel_id + "/subscribe", data, function( response ) {
                        if(response.success){

                            $('#subscription-id').val(response.subscriptionId);

                            $('#button-sub').attr('onclick', 'subs.easyUnsubscribe()');
                            $('#button-sub>i').attr('class', 'fa fa-stop');
                            $('#button-sub').attr("class", "btn btn-success btn-circle");
                            $('#button-sub').tooltip('hide')
                                .attr('data-original-title', 'Unsubscribe to stop gathering data')
                                .tooltip('fixTitle')
                                .tooltip('show');


                            $('#run-status').text('Active   ');
                            //setTimeout(function(){
                            //    $('#run-status').text('');
                            //}, 2500);
                        } else{
                            bootbox.alert(response.message);
                        }

                    });
                } else {
                    bootbox.alert("Unable to subscribe this Channel because the linked Device has not attributes");
                }
            }
        });
    },

    easyUnsubscribe: function(){
        var channel_id = $('#channelId').val();
        bootbox.confirm("Are you sure you want to unsubscribe this Channel?", function(result){
            if(result){
                var data = {
                    subscription_id : $('#subscription-id').val(),
                    context_id : $('#context_id').val(),
                    community_name:  $('#community_name').val()
                };
                if(data.subscription_id != undefined)
                    //$.getJSON( "/channels/" + channel_id + "/unsubscribe/?subid=" + subscription_id, function( response ) {
                    $.post( "/channels/" + channel_id + "/unsubscribe", data,  function( response ) {

                        $('#button-sub').attr('onclick', 'subs.easySubscribe()');
                        $('#button-sub>i').attr('class', 'fa fa-play');
                        $('#button-sub').attr("class", "btn btn-circle");
                        $('#button-sub').tooltip('hide')
                            .attr('data-original-title', 'Subscribe to start gathering data')
                            .tooltip('fixTitle')
                            .tooltip('show');


                        $('#run-status').text('Off   ');
                        //setTimeout(function(){
                        //    $('#run-status').text('');
                        //}, 2500);
                    });
                else
                    bootbox.alert("Cannot find any subscription id ");
            }
        });
    }
}


