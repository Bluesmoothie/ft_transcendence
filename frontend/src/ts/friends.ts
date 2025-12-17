import { UserElement, UserElementType } from 'UserElement.js';
import { User, MainUser } from 'User.js';
import { Router } from 'app.js'

export class FriendManager
{
	private m_pndgContainer:	HTMLElement | null;
	private m_friendsContainer:	HTMLElement | null;
	private m_friends:			UserElement[];
	private m_pndg:				UserElement[];
	private m_user:				User;
	private m_main:				MainUser;
	private m_template:			string;

	constructor(user: User, pndgContainer: string, friendContainer: string, main: MainUser, templateName: string = "user-friend-template")
	{
		this.m_user = user;
		this.m_main = main;
		this.m_pndgContainer = Router.getElementById(pndgContainer);
		this.m_friendsContainer = Router.getElementById(friendContainer);
		this.m_friends = [];
		this.m_pndg = [];
		this.m_template = templateName;

		this.refreshContainers();
	}

	public refreshContainers()
	{
		if (!this.m_friendsContainer || !this.m_pndgContainer || !this.m_user)
			return ;

		this.m_pndgContainer.innerHTML = "";
		this.m_friendsContainer.innerHTML = "";

		const pdng: UserElement[] = this.addFriends(this.m_pndgContainer, UserElementType.FRIEND_PNDG);
		const friends: UserElement[] = this.addFriends(this.m_friendsContainer, UserElementType.FRIEND);
		
		const requestTitle = Router.getElementById("request-title");
		if (this.m_main.id != this.m_user.id)
		{
			if (requestTitle)
				requestTitle.style.display = "none";
			this.m_pndgContainer.style.display = "none";
			return ;
		}
		else
		{
			if (requestTitle)
				requestTitle.style.display = "flex";
			this.m_pndgContainer.style.display = "flex";
		}

		pdng.forEach(elt => {
			const redBtn = elt.getElement("#red-btn");
			const greenBtn = elt.getElement("#green-btn");
			if (!redBtn || !greenBtn)
			{
				console.warn("no redBtn or greenBtn");
				return ;
			}

			if (elt.type !== UserElementType.REQUEST)
				greenBtn.style.display = "flex";

			redBtn.style.display = "flex";
			greenBtn.addEventListener("click", async () => {
				if (!elt.user) return;
				await this.m_main.acceptFriend(elt.user)
				this.refreshContainers();
			});
			redBtn.addEventListener("click", async () => {
				if (!elt.user) return;
				await this.m_main.removeFriend(elt.user)
				this.refreshContainers();
			});
		})

		friends.forEach(elt => {
			const redBtn = elt.getElement("#red-btn");
			if (!redBtn)
				return ;

			redBtn.style.display = "flex";
			redBtn.innerText = "remove";
			redBtn.addEventListener("click", async () => {
				if (!elt.user) return;
				await this.m_main.removeFriend(elt.user)
				this.refreshContainers();
			});
		})
	}

	public addFriendsPndg(container: HTMLElement, type: UserElementType): UserElement[]
	{
		const	pndg: Map<User, number> = this.m_user.pndgFriends;
		var		htmlUser: UserElement[] = [];

		pndg.forEach((sender: number, friend: User) => {
			var elt: UserElement;
			if (sender != this.m_user.id)
				elt = new UserElement(friend, container, type, this.m_template);
			else
				elt = new UserElement(friend, container, UserElementType.REQUEST, this.m_template);

			elt.updateHtml(friend);
			const redBtn = elt.getElement("#red-btn");
			const greenBtn = elt.getElement("#green-btn");
			if (!redBtn || !greenBtn)
				return ;
			elt.getElement("#profile")?.addEventListener("click", () => { Router.Instance?.navigateTo(`/profile?username=${friend.name}`) });
			redBtn.style.display = "none";
			greenBtn.style.display = "none";
			htmlUser.push(elt);
		});
		return htmlUser;
	}

	public addFriends(container: HTMLElement, type: UserElementType): UserElement[]
	{
		if (type == UserElementType.FRIEND_PNDG)
			return this.addFriendsPndg(container, type);

		const	friends: User[] = this.m_user.friends;
		var		htmlUser: UserElement[] = [];

		friends.forEach(friend => {
			const elt = new UserElement(friend, container, type, this.m_template);

			elt.getElement("#profile")?.addEventListener("click", () => { Router.Instance?.navigateTo(`/profile?username=${friend.name}`) });
			elt.updateHtml(friend);
			const redBtn = elt.getElement("#red-btn");
			const greenBtn = elt.getElement("#green-btn");
			if (!redBtn || !greenBtn)
				return ;
			redBtn.style.display = "none";
			greenBtn.style.display = "none";
			htmlUser.push(elt);
		});
		return htmlUser;
	}
}
