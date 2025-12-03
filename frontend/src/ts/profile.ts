import { getUserFromId, getUserFromName, MainUser, Stats, User } from "User.js";
import { UserElement } from "UserElement.js";
import { FriendManager } from "friends.js";
import * as utils from 'utils.js'

var main: MainUser = new MainUser(document.getElementById("user-container"), null, null);
await main.loginSession();
main.onLogout((user) => { window.location.href = window.location.origin })
if (main.getId() == -1) // user not login
	window.location.href = window.location.origin;

var user: User = main;
if (utils.getUrlVar().has("username"))
{
	const vars = utils.getUrlVar();
	user = await getUserFromName(vars.get("username"));
}

const stats: Stats = user.stats;
new FriendManager(user, "pndg-container", "friend-container", main);
addMatch();

async function addMatch()
{
	const histContainer = document.getElementById("history-container");

	var response = await fetch(`/api/user/get_history_name/${user.name}`, { method : "GET" })
	const code = response.status;

	if (code == 404)
	{
		const text = document.createElement("p");

		text.innerText = "no recorded history";
		histContainer.append(text);
		return ;
	}

	if (code != 200)
		return ;

	var data = await response.json();
	for (let i = 0; i  < data.length; i ++) {
		const elt = data[i];
		const clone = await addMatchItem(elt);
		histContainer.append(clone);
	}
}

async function addMatchItem(json: any): Promise<HTMLElement>
{
	const template = document.getElementById("match-template") as HTMLTemplateElement;
	const clone: HTMLElement = template.content.cloneNode(true) as HTMLElement;

	const matchup = clone.querySelector("#matchup") as HTMLElement;
	const status = clone.querySelector("#status") as HTMLElement;
	const score = clone.querySelector("#score") as HTMLElement;
	const date = clone.querySelector("#date") as HTMLElement;

	const player2Id = json.user1_id === user.getId() ? json.user2_id : json.user1_id;
	const player2Score = json.user1_id === user.getId() ? json.user2_score: json.user1_score;
	const player1Score = json.user1_id === user.getId() ? json.user1_score: json.user2_score;

	const player2: User = await getUserFromId(player2Id);
	matchup.innerText = `${user.name} - ${player2.name}`;
	status.innerText = `${player1Score > player2Score ? "won" : "lost" }`;
	status.style.color = `${player1Score > player2Score ? "var(--green)" : "var(--red)" }`;
	score.innerText = `${player1Score} - ${player2Score}`;
	date.innerText = json.created_at;

	return clone;
}

const profile_extended = document.getElementById("profile-extended");
UserElement.setStatusColor(user, profile_extended.querySelector("#user-status"));
(<HTMLImageElement>profile_extended.querySelector("#avatar-img")).src	= user.getAvatarPath();
(<HTMLElement>profile_extended.querySelector("#name")).textContent = user.name;
(<HTMLElement>profile_extended.querySelector("#created_at")).innerText	= `created at: ${user.created_at.split(' ')[0]}`;
(<HTMLElement>profile_extended.querySelector("#created_at")).innerText	= `created at: ${user.created_at.split(' ')[0]}`;

document.getElementById("game-played").innerText	= `${stats.gamePlayed}`;
document.getElementById("game-won").innerText		= `${stats.gameWon}`;
var winrate = 0;
if (stats.gamePlayed > 0)
	winrate = stats.gameWon > 0 ? (stats.gameWon / stats.gamePlayed) * 100 : 0;
document.getElementById("winrate").innerText		= `${stats.gamePlayed > 0 ? winrate + "%" : "n/a" }`;
document.getElementById("curr-elo").innerText		= `${stats.currElo}p`;
document.getElementById("max-elo").innerText		= `${stats.maxElo}p`;


const userMenuContainer = document.getElementById("user-menu-container");
document.getElementById("banner")?.addEventListener("click", () => window.location.href = window.location.origin);
document.getElementById("logout_btn")?.addEventListener("click", () => main.logout());
document.getElementById("profile_btn")?.addEventListener("click", () => window.location.href = window.location.origin + "/profile");
document.getElementById("settings_btn")?.addEventListener("click", () => window.location.href = window.location.origin + "/settings");
document.getElementById("user-menu-btn").addEventListener('click', () => {
	userMenuContainer.classList.toggle("hide");
});
