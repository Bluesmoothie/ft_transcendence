const create_btn = document.getElementById("create_btn");
if (create_btn)
	create_btn.addEventListener('click', submit_new_user);
else
	console.error("no submit btn found !");


const login_btn = document.getElementById("login_btn");
if (login_btn)
	login_btn.addEventListener('click', login);
else
	console.error("no submit btn found !");



// Todo: change using sha256
function hash_string(name: string)
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

async function submit_new_user()
{
	var		email = (<HTMLInputElement>document.getElementById("create_email")).value;
	var		passw = (<HTMLInputElement>document.getElementById("create_passw")).value;
	var		username = (<HTMLInputElement>document.getElementById("create_username")).value;

	console.log(email);
	console.log(passw);
	console.log(username);
	console.log(hash_string(passw));

	const response = await fetch("/api/create_user", {
		method: "POST",
		headers: {
			'content-type': 'application/json'
		},
		body: JSON.stringify({
			email: email,
			passw: hash_string(passw),
			username: username,
		})
	});
	const data = await response.json();

	const jsonString: string = JSON.stringify(data);
	console.log(data);
	var txt = document.getElementById("placeholder");
	if (txt)
	{
		if (response.status == 201)
			txt.innerText = "user created";
		else 
			txt.innerText = "database error";
	}
	addLog(response.status, jsonString);
}

async function login()
{
	var		email = (<HTMLInputElement>document.getElementById("login_email")).value;
	var		passw = (<HTMLInputElement>document.getElementById("login_passw")).value;

	console.log(email);
	console.log(passw);
	console.log(hash_string(passw));

	const response = await fetch("/api/login", {
		method: "POST",
		headers: {
			'content-type': 'application/json'
		},
		body: JSON.stringify({
			email: email,
			passw: hash_string(passw),
		})
	});
	const data = await response.json();

	const jsonString: string = JSON.stringify(data);
	console.log(data);
	var txt = document.getElementById("placeholder");
	if (txt)
	{
		if (response.status == 200)
			txt.innerText = "connected !";
		else if (response.status == 404)
			txt.innerText = "passw or email invalid";
		else 
			txt.innerText = "database error";
	}

	addLog(response.status, jsonString);
}
