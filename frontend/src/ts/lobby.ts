import { MainUser, User } from "User.js";
import { UserElement, UserElementType } from "UserElement.js";
import { Chat } from "modules/chat.js";
import { Router } from "router.js";

var user: MainUser = new MainUser(document.getElementById("user-container"), null, null);
await user.loginSession();
user.onLogout((user) => { window.location.href = window.location.origin })
if (user.id == -1) // user not login
	window.location.href = window.location.origin;

const chatInput: HTMLInputElement = document.getElementById("chat-in") as HTMLInputElement;
const chat = new Chat(user, document.getElementById("chat-out"), chatInput);
chat.onConnRefresh(fillUserList);
new Router(user, chat);

const userMenuContainer = document.getElementById("user-menu-container");

document.getElementById("user-list-btn").addEventListener('click', () => {
	showListContainer(ListState.USER);
});
document.getElementById("friend-list-btn").addEventListener('click', () => {
	showListContainer(ListState.FRIEND);
});
document.getElementById("user-menu-btn").addEventListener('click', () => {
	userMenuContainer.classList.toggle("hide");
});

document.getElementById("banner")?.addEventListener("click", () => window.location.href = window.location.origin);
document.getElementById("logout_btn")?.addEventListener("click", () => user.logout());
document.getElementById("profile_btn")?.addEventListener("click", () => window.location.href = window.location.origin + "/profile");
document.getElementById("settings_btn")?.addEventListener("click", () => window.location.href = window.location.origin + "/settings");

enum ListState
{
	HIDDEN,
	FRIEND,
	USER,
}

var state = ListState.HIDDEN;
function showListContainer(newState: ListState)
{
	const userListParent = document.getElementById("user-list-parent");
	
	if (state != ListState.HIDDEN && state == newState)
	{
		userListParent.classList.add("hide");
		state = ListState.HIDDEN;
	}
	else
	{
		state = newState;
		userListParent.classList.remove("hide");
	}

	if (state == ListState.USER)
		fillUserList(chat.conns);
	if (state == ListState.FRIEND)
		fillUserList(user.friends);
}

function fillUserList(users: User[])
{
	const container = document.getElementById("user-list-container");
	container.innerHTML = "";

	const text = document.createElement("p");
	text.innerText = state == ListState.USER ? "user list" : "friends list";
	text.style.color = "var(--white)";

	users.forEach((conn: User) => {
		const elt = new UserElement(conn, container, UserElementType.STANDARD, "user-template");
		elt.clone.addEventListener("click", () => {
			console.log(`${window.location.origin}/profile?username=${conn.name}`);
			window.location.href = `${window.location.origin}/profile?username=${conn.name}` });
		elt.updateHtml(conn);
	})
	container.prepend(text);
}

async function uploadAvatar()
{
	var fileInput = document.getElementById("avatar_input") as HTMLInputElement;
	if (!fileInput)
	{
		console.error("no avatar_upload elt found");
		return ;
	}
	const retval: number = await user.setAvatar(fileInput.files[0]);
}

