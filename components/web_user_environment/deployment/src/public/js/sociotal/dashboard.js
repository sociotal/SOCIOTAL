function fillDevicesCount(){
    $.getJSON( "/api/devices?field=count", function( count ) {
        $('#devices').text(count.count);
    });

    $.getJSON( "/api/communities?field=count", function( count ) {
        $('#communities').text(count.count);
    });
};
