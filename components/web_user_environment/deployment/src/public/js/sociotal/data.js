

var channel_id;

function Data(id){
    channel_id = id;
}


Data.prototype = {
    constructor: Data,

    //// detect all the anomalies from a channel_id - IT'S A TEST FUNCTION
    //detectAnomalies: function (channel_id){
    //    console.log("inside detectAnomalies.");
    //    $.getJSON( "/channels/" + channel_id + "/data/detectanomaly", function( data ) {
    //
    //        console.log("Validità dato: \n" + JSON.stringify(data));
    //        var anomaly_detected = false;
    //        var array_anomalies = [];
    //
    //        //$('#anomaly-table > tbody > tr').remove();
    //        $('#anomaly-table > tbody').append('<tr></tr>');
    //
    //        if (data instanceof Array) {
    //            data.forEach(function (item) {
    //                if (item.validity == false) {
    //                    $('#data-template').tmpl(item).appendTo('#anomaly-table > tbody');
    //                }
    //            });
    //        } else {
    //            if (data.validity == false) {
    //                $('#data-template').tmpl(data).appendTo('#anomaly-table > tbody');
    //            }
    //        }
    //
    //        //console.log("Anomaly detected in Temperatures: " + JSON.stringify(array_anomalies)+"\n");
    //
    //        if (anomaly_detected) {
    //            bootbox.alert("Anomaly detected in Temperatures: " + JSON.stringify(array_anomalies)+"\n");
    //        }
    //
    //    });
    //},

    activateAnomalyDetection: function (channel_id){
        var self = this;
        //var channel_id = $('#channelId').val();
        $.getJSON("/channels/" + channel_id + "/activateAnomalyDetection/?activate=true", function (response) {
            if(response.success){
                console.log("anomaly detection activated");
                self.loadData();
                $('#anomaly-status').text('Active')
                                    .attr("style", "color:#f0ad4e");

                $('#button-anomaly').attr('onclick', 'data.deactivateAnomalyDetection(\''+channel._id+'\')');    //\''+channel._id+'\')'
                $('#button-anomaly>i').attr('class', 'fa fa-exclamation');
                $('#button-anomaly').attr("class","btn btn-warning btn-circle");
                $('#button-anomaly').tooltip('hide')
                  .attr('data-original-title', 'Deactivate anomaly detection')
                  .tooltip('fixTitle')
                  .tooltip('show');

            }
        });
    },

    deactivateAnomalyDetection: function (channel_id){
        var self = this;
        //var channel_id = $('#channelId').val();
        $.getJSON("/channels/" + channel_id + "/deactivateAnomalyDetection/?activate=false", function (response) {
            if(response.success){
                console.log("anomaly detection deactivated");
                self.loadData();
                $('#anomaly-status').text('Off')
                                    .attr("style","color:black;");

                $('#button-anomaly').attr('onclick', 'data.activateAnomalyDetection(\''+channel._id+'\')');
                $('#button-anomaly>i').attr('class', 'fa fa-exclamation');
                $('#button-anomaly').attr("class","btn btn-circle");
                $('#button-anomaly').tooltip('hide')
                  .attr('data-original-title', 'Activate anomaly detection')
                  .tooltip('fixTitle')
                  .tooltip('show');

            }
        });
    },

    loadAnomaly: function (data){
        console.log("inside loadAnomaly.");
        console.log("anomalia su dato: \n" + JSON.stringify(data));
        $('#anomaly-table > tbody').append('<tr></tr>');
        $('#data-template-anomaly').tmpl(data).appendTo('#anomaly-table > tbody');
    },

    clearData: function(){
        bootbox.confirm("Are you sure to delete all data?", function(result){
                if(result){
                    //$('#loading-indicator').show();
                    $.getJSON( "/channels/" + channel_id + "/data/clear", function( response ) {
                        if(response.success){
                            $('#loading-indicator').hide();

                            $('#data-table > tbody > tr').remove();
                            $('#data-table > tbody').append('<tr><td></td><td></td></tr>');

                            $('#data-container').hide();
                            $('#data-empty').show();
                            var dataLength = (response.data !== undefined) ? response.data.length : 0;
                            $('#data-count').text(dataLength);
                        }
                    });
                }
            }
        );
    },

    loadData: function (){
        $.getJSON("/channels/" + channel_id + "/data", function (response) {
            if (response.success) {
                $('#button-run').show();
                $('#data-table > tbody > tr').remove();
                $('#data-content').val(JSON.stringify(response.data));


                if (response.data.length > 0) {
                    var maxItemsPage = 10;

                    var total = (response.data.length / maxItemsPage);
                    total = (( total % 1) > 0) ? parseInt(total + 1) : parseInt(total);

                    $('#paginator').bootpag({
                        total: total,
                        page: 1,
                        maxVisible: 10
                    }).on("page", function (event, page) {
                        $('#data-table > tbody > tr').remove();
                        $('#anomaly-table > tbody > tr').remove();

                        var data = $.parseJSON($('#data-content').val());
                        var num = page;
                        var start = (num - 1) * maxItemsPage;
                        var end = start + maxItemsPage;
                        var dataPage = data.slice(start, end);

                        $('#data-count').text(start + " - " + end + " of " + response.data.length);

                        dataPage.forEach(function (item) {
                            item.date_created = new Date(item.date_created).toLocaleString();

                            if (response.anomalyDetection && !item.valid) {
                                $('#data-template-anomaly').tmpl(item).appendTo('#data-table > tbody');
                                $('#data-template-anomaly').tmpl(item).appendTo('#anomaly-table > tbody');
                            } else {
                                $('#data-template').tmpl(item).appendTo('#data-table > tbody');
                            }
                        });

                        //$(this).bootpag({total: total, maxVisible: maxVisible});

                        //***********************************************************************         CHARTS



                        //
                        //
                        //
                        //
                        //
                        // var attributeNames = channel.attributes.map(function(a) {return a.name; });
                        // var datesT = []; //dataPage.map(function(a) {if (a.data_type == "Temperature") return a.date_created; });
                        // var valuesT = []; //dataPage.map(function(a) {if (a.data_type == "Temperature") return a.value; });
                        // var datesH = []; //dataPage.map(function(a) {if (a.data_type == "Temperature") return a.date_created; });
                        // var valuesH = []; //dataPage.map(function(a) {if (a.data_type == "Temperature") return a.value; });
                        //
                        // data.forEach(function (item) {
                        //     console.log(item);
                        //     if (item.data_type == "AmbientTemperature"){
                        //         datesT.push(item.date_created);
                        //         valuesT.push(item.value);
                        //     }
                        //     if (item.data_type == "HumidityValue"){
                        //         datesH.push(item.date_created);
                        //         valuesH.push(item.value);
                        //     }
                        // });
                        //
                        // var ctx1 = document.getElementById("AmbientTemperature_canvas");
                        // var ctx2 = document.getElementById("HumidityValue_canvas");
                        //
                        // var data1 = {
                        //     labels: datesT,
                        //     datasets: [
                        //         {
                        //             label: "My First dataset",
                        //             fill: false,
                        //             lineTension: 0.1,
                        //             backgroundColor: "rgba(75,192,192,0.4)",
                        //             borderColor: "rgba(75,192,192,1)",
                        //             borderCapStyle: 'butt',
                        //             borderDash: [],
                        //             borderDashOffset: 0.0,
                        //             borderJoinStyle: 'miter',
                        //             pointBorderColor: "rgba(75,192,192,1)",
                        //             pointBackgroundColor: "#fff",
                        //             pointBorderWidth: 1,
                        //             pointHoverRadius: 5,
                        //             pointHoverBackgroundColor: "rgba(75,192,192,1)",
                        //             pointHoverBorderColor: "rgba(220,220,220,1)",
                        //             pointHoverBorderWidth: 2,
                        //             pointRadius: 1,
                        //             pointHitRadius: 10,
                        //             data: valuesT,
                        //         }
                        //     ]
                        // };
                        //
                        // var data2 = {
                        //     labels: datesH,
                        //     datasets: [
                        //         {
                        //             label: "My First dataset",
                        //             fill: false,
                        //             lineTension: 0.1,
                        //             backgroundColor: "rgba(75,192,192,0.4)",
                        //             borderColor: "rgba(75,192,192,1)",
                        //             borderCapStyle: 'butt',
                        //             borderDash: [],
                        //             borderDashOffset: 0.0,
                        //             borderJoinStyle: 'miter',
                        //             pointBorderColor: "rgba(75,192,192,1)",
                        //             pointBackgroundColor: "#fff",
                        //             pointBorderWidth: 1,
                        //             pointHoverRadius: 5,
                        //             pointHoverBackgroundColor: "rgba(75,192,192,1)",
                        //             pointHoverBorderColor: "rgba(220,220,220,1)",
                        //             pointHoverBorderWidth: 2,
                        //             pointRadius: 1,
                        //             pointHitRadius: 10,
                        //             data: valuesH,
                        //         }
                        //     ]
                        // };
                        //
                        // var AmbientTemperature_canvas = new Chart(ctx1, {
                        //     type: 'line',
                        //     data: data1,
                        //     options: {
                        //         xAxes: [{
                        //             display: false
                        //         }]
                        //     }
                        // });
                        //
                        // var HumidityValue_canvas = new Chart(ctx2, {
                        //     type: 'line',
                        //     data: data2,
                        //     options: {
                        //         xAxes: [{
                        //             display: false
                        //         }]
                        //     }
                        // });
                        //
                        //



                    //***********************************************************************








                    }).trigger("page", 1);

                    $('#data-empty').hide();
                    $('#data-container').show();



                } else {
                    $('#data-empty').show();
                    $('#data-container').hide();
                }
            }
        });

    },

    connectSocketIo: function(socketioHost){
        //var socket = io.connect(socketioHost);
        var socket = io.connect();
        var namespace = 'new-data-' + channel_id;
        var self = this;

        socket.on(namespace, function (data) {
            if(data.success) {
                self.loadData();
                // var item = data.data;
                // item.date_created = new Date(item.date_created).toLocaleString();
                // $('#data-template').tmpl(data.data).prependTo('#data-table > tbody');
            } else {
                console.log("There is a problem:", data);
            }
        });

        socket.on('new-anomaly', function (data) {
            console.log("new anomaly socket");
            //console.log(data);
            self.loadAnomaly(data);
        });
    }
}