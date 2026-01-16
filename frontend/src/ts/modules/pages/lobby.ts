import { MainUser, User, UserStatus } from "modules/user/User.js";
import { UserElement, UserElementType } from "modules/user/UserElement.js";
import { Chat } from "modules/chat/chat.js";
import { GameRouter } from "router.js";
import { Router } from "modules/router/Router.js";
import { HeaderSmall } from "./HeaderSmall.js";
import { ViewComponent } from "modules/router/ViewComponent.js";

	enum ListState
	{
		HIDDEN,
		FRIEND,
		USER,
	}

export class LobbyView extends ViewComponent
{
	private m_user:	MainUser | null = null;
	private m_chat:	Chat | null = null;
	private state:	ListState = ListState.HIDDEN;
	private	m_gameRouter:	GameRouter | null = null;

	private m_userContainer: HTMLElement | null = null;

	constructor()
	{
		super();
		this.m_user = new MainUser();
	}

	public async enable()
	{
		if (!this.m_user)
		{
			console.warn("no main user");
			return;
		}

		this.m_userContainer = this.querySelector("#user-container");

		await this.m_user.loginSession();

		if (this.m_user.id == -1)
		{
			Router.Instance?.navigateTo("/");
			return ;
		}
		this.m_user.displayTutorial();
		this.m_user.onLogout(() => Router.Instance?.navigateTo("/"));

		const chatInput: HTMLInputElement = this.querySelector("#chat-in") as HTMLInputElement;
		const chatOutput: HTMLInputElement = this.querySelector("#chat-out") as HTMLInputElement;
		if (!chatInput || !chatOutput)
			return ;

		if (!this.m_chat || this.m_chat.user?.id != this.m_user.id)
		{
			this.m_chat = new Chat(this.m_user, chatOutput, chatInput);
			this.m_chat.onConnRefresh((conns: User[]) => this.fillUserList(conns));
		}

		if (this.m_gameRouter == null)
		{
			this.m_gameRouter = new GameRouter(this.m_user, this.m_chat, this);
			this.m_gameRouter.assignListener();
			this.m_gameRouter.navigateTo('home', '');
		}

		this.m_user.gameRouter = this.m_gameRouter;

		const container = this.querySelector("#user-list-container") as HTMLElement;
		if (container)
			container.innerHTML = "";

		this.addTrackListener(this.querySelector("#user-list-btn"), "click", () => {
			if (!this.m_chat || !this.m_user) return;
			this.showListContainer(ListState.USER, this.m_chat, this.m_user);
			window.dispatchEvent(new CustomEvent('pageChanged'));
		});
		this.addTrackListener(this.querySelector("#friend-list-btn"), "click", () => {
			if (!this.m_chat || !this.m_user) return;
			this.showListContainer(ListState.FRIEND, this.m_chat, this.m_user);
			window.dispatchEvent(new CustomEvent('pageChanged'));
		});

		new HeaderSmall(this.m_user, this, "header-container");
	}


	public async disable()
	{
		this.clearTrackListener();

		if (this.m_user)
		{
			this.m_user.resetCallbacks();
			this.m_user.newUser();
		}

		if (this.m_gameRouter?.m_gameMenu)
			this.m_gameRouter.m_gameMenu.destroy();

		if (this.m_userContainer)
			this.m_userContainer.innerHTML = "";

	}

	private showListContainer(newState: ListState, chat: Chat, user: User)
	{
		const userListParent = this.querySelector("#user-list-parent");
		if (!userListParent) return;
		
		if (this.state != ListState.HIDDEN && this.state == newState)
		{
			userListParent.classList.add("hide");
			this.state = ListState.HIDDEN;
		}
		else
		{
			this.state = newState;
			userListParent.classList.remove("hide");
		}

		if (this.state == ListState.USER && chat.conns)
			this.fillUserList(chat.conns);
		if (this.state == ListState.FRIEND)
			this.fillUserList(user.friends);
	}

	private fillUserList(users: User[])
	{
		const container = this.querySelector("#user-list-container") as HTMLElement;
		container.innerHTML = "";

		const text = document.createElement("p");
		text.innerText = this.state == ListState.USER ? "user list" : "friends list";
		text.setAttribute('data-i18n', this.state == ListState.USER ? "user_list" : "friend_list");
		text.style.color = "var(--color-white)";

		users.forEach((conn: User) => {
			if (conn.status == UserStatus.UNAVAILABLE)
				return ;
			const elt = new UserElement(conn, container, UserElementType.STANDARD, "user-template");
			elt.updateHtml(conn);
		})
		container.prepend(text);
	}
}

