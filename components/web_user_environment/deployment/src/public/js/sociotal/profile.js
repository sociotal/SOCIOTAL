

function confirmDelete(userId){
	bootbox.dialog({
		message: "You selected to delete your account and ALL of your data. The operation is IRREVERSIBLE.  Are you sure you want to delete your SocIoTal account?",
		title: "About DELETING your account",
		buttons: {

			danger: {
				label: "Yes, delete my Account!",
				className: "btn-danger",
				callback: function() {
					deleteAccount(userId);
				}
			},
			main: {
				label: "Cancel",
				className: "btn-primary",
				callback: function() {

				}
			}
		}
	});
}

function deleteAccount(userId){
	$.ajax({
		method: "DELETE",
		url: "/users/"+userId
	})
	.success(function( msg ) {
		 bootbox.alert("Your Account and all the related data has been deleted. Thank you for your interest in SocIoTal.", function(){
			 window.location = '/';
		 });
	});
}
