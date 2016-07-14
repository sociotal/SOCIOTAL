/**
 * Created by albe on 23/05/16.
 */

function MailChannel(){}



// show communities during view of all devices
function listMyCommunitiesOnMailChannel(){
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


