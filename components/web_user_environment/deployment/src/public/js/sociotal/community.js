/**
 * Created by albe on 25/02/16.
 */



function Community(){}





function saveCommunity(){
  var name = $('#name').val();
  var description = $('#description').val();

  if(name != "" && description != ""){

    var community = {"name": $('#name').val(),
      "description": $('#description').val()}

    console.log(community);

    var data = {"community" : community};
    //if(mode == "edit"){
    //  $.ajax({
    //    type: "PUT",
    //    url: "/devices",
    //    contentType: "application/json",
    //    data: JSON.stringify(data)
    //  }).done(function( response ) {
    //    bootbox.alert("Device saved!!");
    //  });
    //
    //} else {

        $.post("/communities/create", data, function(response) {

          console.log("RESPONSE DA JADE: " + JSON.stringify(response));

          if (response.result == "failed") {
            bootbox.alert("Warning! Save community returns " + JSON.stringify(response.result) );
            
          }else {
            bootbox.alert('Community succesfully registered!', function(){
              window.location.href = '/communities';
            });

          }

        }, 'json');
    //  });
    //}
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


function deleteCommunity(id, name){
  bootbox.confirm("Are you sure to delete this Community? ", function (result) {
    if (result) {
      $.ajax({
        url: '/communities/' + id + '/'+ name ,
        type: 'DELETE',
        success: function (response) {
          if (response.success) {
            bootbox.alert('Community deleted!', function () {
              window.location.href = '/communities';
            });

          }
        }
      });
    }
  });
}


function affiliateCommunity(id){
    bootbox.alert("A notification email will be sent to community owner ", function (result) {
        var url = '/communities/' + id + '/affiliation';

        $.get(url, function (response) {
            if (response) {
                bootbox.alert("A request notification is sent to community owner!");
            }
        });

    });
}

function revokeAffiliation(id, communityName){
    bootbox.confirm("Are you sure you want to leave this community?", function (result) {
        if(result){
            var url = '/communities/' + id + '/revoke?community_name='+communityName;

            $.get(url, function (response) {
                if (response.removed) {
                    bootbox.alert("You are successful removed from this community. Please relogin to the SocIoTal Platform.", function(){
                       // window.location = "/communities?reloadToken=true";
                      window.location = "/logout";
                    });
                }
            });
        }
    });
}


function listMyCommunities(){
  var url = '/communities/listMyCommunities';
  
  $.get(url, function (response) {
    if (response.result == "success" && response.communities) {
      console.log(JSON.stringify(response.communities));


      response.communities.forEach(function(community){
        $('#community-template').tmpl(community).appendTo('#my-communities-container-default');

      });
      console.log(response.communities.length);
      $("#my_communities_title").text("My Communities ("+response.communities.length+")");
      $("#loader").hide();

    }else {
      $("#my_communities_title").text("My Communities (0)");
      $("#my_communities_description").text("You don't belong to any community yet");
      $("#loader").hide();
    }
  });
}




function loadDevicesForCommunity(community_name){

  console.log("community_name :"+community_name);

  $.getJSON("/api/devices?community_name="+community_name, function (response, status) {
    if(response){

      console.log(response);

      // $("#loader").hide();
      // var count = response.devices.errorCode.details.split(":")[1];
      // $("#devices-count").text(count);
      // $("#devices-container").attr("style", "");
      // response.devices.contextResponses.forEach(function (element) {
      //   //console.log(JSON.stringify(element.contextElement.id));
      //   var id = element.contextElement.id;
      //   var name = id.split(":")[id.split(":").length-1];
      //   console.log(name);
      //   console.log(name.length);
      //   element.contextElement.name = (name.length >= 25) ? name.substring(0, 15) + "..." : name ;
      //   $('#devices-template').tmpl(element.contextElement).appendTo('#devices-container');
      // });


    }
  });

}












function listMembers(community_name, message){
  console.log("listMembers "+community_name);
  
  if (message) {
    bootbox.alert(message);
  }

  $.getJSON('/communities/' + community_name + '/members/', function (response) {
        if (response) {
            $("#loader").hide();

            if(response.revoke){
                $("#revoke").show();
            } else {
                $("#affiliate").show();
            }
            if(response.members.length > 0){
                response.members.forEach(function (member) {
                    console.log("member: "+JSON.stringify(member));
                    $('#members-template').tmpl(member).appendTo('#members-container');
                });

            } else
                $('#members-container').text("No members found for this community. "+response.message)

        } else
          $('#members-container').text("No members found for this community")
    });
}