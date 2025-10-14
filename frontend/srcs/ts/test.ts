const btn = document.getElementById("submit_btn");
if (btn)
{
	btn.addEventListener('click', submit_new_user);
}
else
{
	console.error("no submit btn found !");
}

function submit_new_user()
{
	var		email = (<HTMLInputElement>document.getElementById("email")).value;
	var		passw = (<HTMLInputElement>document.getElementById("passw")).value;
	var		username = (<HTMLInputElement>document.getElementById("username")).value;

	console.log(email);
	console.log(passw);
	console.log(username);
}
