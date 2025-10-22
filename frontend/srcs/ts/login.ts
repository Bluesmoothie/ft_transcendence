import { User, UserElement, UserElementType } from './User.js';

var user:User = null;
const main_user_elt:UserElement = new UserElement(user, document.body, UserElementType.MAIN);

document.getElementById("create_btn")?.addEventListener("click", submitNewUser);
document.getElementById("login_btn")?.addEventListener('click', login);
document.getElementById("logout_btn")?.addEventListener("click", logout);
document.getElementById("avatar_upload_btn")?.addEventListener("click", uploadAvatar);
document.getElementById("add_friend_btn")?.addEventListener("click", sendFriendInvite);

async function sendFriendInvite()
{
	var inviteInput = document.getElementById("add_friend_input") as HTMLInputElement;
	if (!inviteInput)
	{
		console.error("no add_friend_input found");
		return ;
	}

	if (!user)
	{
		console.error("you need to login to add friends");
		return ;
	}

	var response = await fetch("/api/add_friend", {
		method: "POST",
		headers: {
			'content-type': 'application/json'
		},
		body: JSON.stringify({
			user_id: user.getId().toString(),
			friend_name: inviteInput.value
		})
	});
	var data = await response.json();
	console.log(data.id);
	getFriends();
}

async function uploadAvatar()
{
	if (!user)
	{
		setPlaceholderTxt("you need to login first");
		return ;
	}

	var fileInput = document.getElementById("avatar_input") as HTMLInputElement;
	if (!fileInput)
	{
		console.error("no avatar_upload elt found");
		return ;
	}

	await user.setAvatar(fileInput.files[0]);
	main_user_elt.updateHtml(user);
}

// Todo: change using sha256
function hashString(name: string)
{
	let hash = 0;

	for	(let i = 0; i < name.length; i++)
	{
		let c = name.charCodeAt(i);
		hash = ((hash << 5) - hash) + c;
		hash = hash & hash;
	}
	return hash;
}

function setPlaceholderTxt(msg:string)
{
	var txt = document.getElementById("placeholder");
	if (!txt)
	{
		console.error("no placeholder text found");
		return ;
	}

	txt.innerText = msg;
}

function addLog(code:number, msg:string)
{
	const parent = document.getElementById("debug-box");

	if (!parent)
		return;

	const child = document.createElement("p");
	child.textContent = `<${code}>: ${msg}`;
	child.className = "debug-text";
	
	parent.prepend(child);
}

// TODO: set user status based on login / logout
function setUser(data:any)
{
	if (!data) // logout
	{
		main_user_elt.updateHtml(user);
		return ;
	}

	var parsed = JSON.parse(data);
	console.log(data);

	user = new User(parsed.id, parsed.name, parsed.email, parsed.profile_picture);
	main_user_elt.updateHtml(user);
	getFriends();
}

async function submitNewUser()
{
	var		email = (<HTMLInputElement>document.getElementById("create_email")).value;
	var		passw = (<HTMLInputElement>document.getElementById("create_passw")).value;
	var		username = (<HTMLInputElement>document.getElementById("create_username")).value;

	const response = await fetch("/api/create_user", {
		method: "POST",
		headers: {
			'content-type': 'application/json'
		},
		body: JSON.stringify({
			email: email,
			passw: hashString(passw),
			username: username,
		})
	});
	const data = await response.json();

	const jsonString: string = JSON.stringify(data);
	if (response.status == 200)
		setPlaceholderTxt("user created");
	else if (response.status == 403)
		setPlaceholderTxt("email invalid");
	else 
		setPlaceholderTxt("database error");

	addLog(response.status, jsonString);
}

async function getUserFromId(id:string) : Promise<User>
{
	const params = { user_id: id };
	const queryString = new URLSearchParams(params).toString();
	var response = await fetch(`/api/get_profile_id?${queryString}`);
	var data = await response.json();
	console.log(data);
	return new User(data.id, data.name, "", data.profile_picture);
}

async function getFriends()
{
	document.getElementById("user-list").innerHTML = "";

	const params = { user_id: user.getId().toString() };
	const queryString = new URLSearchParams(params).toString();
	var response = await fetch(`/api/get_friends?${queryString}`);
	var data = await response.json();

	for (let i = 0; i < data.length; i++) {
		const element = data[i];
		var id = element.user_id == user.getId() ? element.friend_id : element.user_id;
		const parent = document.getElementById("user-list") as HTMLElement;
		const elt:UserElement = new UserElement(await getUserFromId(id), parent, UserElementType.FRIEND);
	}
}

async function login()
{
	var		email = (<HTMLInputElement>document.getElementById("login_email")).value;
	var		passw = (<HTMLInputElement>document.getElementById("login_passw")).value;

	if (user)
	{
		setPlaceholderTxt("please logout first.");
		return ;
	}

	const response = await fetch("/api/login", {
		method: "POST",
		headers: {
			'content-type': 'application/json'
		},
		body: JSON.stringify({
			email: email,
			passw: hashString(passw),
		})
	});
	const data = await response.json();

	const jsonString: string = JSON.stringify(data);
	if (response.status == 404)
		setPlaceholderTxt("passw or email invalid");
	else if (response.status == 500) 
		setPlaceholderTxt("database error");
	else if (response.status == 200)
	{
		setPlaceholderTxt("connected !");
		setUser(jsonString);
	}
	addLog(response.status, jsonString);
}

function logout()
{
	addLog(200, "user has logout");
	user = null;
	setUser(null);
	document.getElementById("user-list").innerHTML = "";
}
