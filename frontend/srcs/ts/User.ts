export class User
{
	/* public vars */
	public name:			string;

	/* private vars */
	private m_id:			number;

	private m_email:		string;
	private m_avatarPath:	string;
	
	private m_friends:		User[];


	constructor(id:number, name:string, email:string, avatar: string)
	{
		this.m_id = id;
		this.name = name;
		this.m_email = email;
		this.m_avatarPath = avatar;
	}

	public addFriend(friend:User)
	{
		if (!friend)
		{
			console.error("friend is null");
			return ;
		}
		this.m_friends.push(friend);
	}

	public getFriends() : User[]
	{
		return this.m_friends;
	}

	public getId() : number
	{
		return this.m_id;
	}

	public getAvatarPath() : string
	{
		return this.m_avatarPath + "?" + new Date().getTime();
	}

	public async setAvatar(file:File) : Promise<any>
	{
		const formData = new FormData();
		if (!file)
			return ;

		formData.append("file", file, file.name);

		var response = await fetch("/api/upload/avatar", {
			method: "POST",
			headers: {
				'id': this.m_id.toString(),
				'email': this.m_email,
				'prev_avatar': this.m_avatarPath,
			},
			body: formData, 
			
		});
		var data = await response.json();
		console.log(data);

		this.m_avatarPath = "/api/images/" + data.filename;

		return response;
	}

}

export enum UserElementType
{
	MAIN = 0,
	STANDARD,
	FRIEND
}

export class UserElement
{
	private	m_user:				User;

	private m_htmlAvatar:		HTMLImageElement;
	private m_htmlName:			HTMLElement;
	private m_htmlContainer:	HTMLElement;

	private m_htmlBtnContainer:	HTMLElement;
	private m_htmlLogoutBtn:	HTMLButtonElement;
	private m_htmlSettingsBtn:	HTMLButtonElement;
	private m_htmlFriendBtn:	HTMLButtonElement;

	constructor(user:User, parent:HTMLElement, type:UserElementType)
	{
		this.m_user = user;

		this.m_htmlContainer = document.createElement("div");
		this.m_htmlContainer.className = "user-container";

		this.m_htmlAvatar = document.createElement("img");
		this.m_htmlAvatar.className = "user-avatar";
		this.m_htmlAvatar.id = "user-avatar";

		this.m_htmlName = document.createElement("h3")

		this.m_htmlBtnContainer = document.createElement("div");
		this.m_htmlLogoutBtn = document.createElement("button");
		this.m_htmlLogoutBtn.innerText = "logout";
		this.m_htmlSettingsBtn = document.createElement("button");
		this.m_htmlSettingsBtn.innerText = "settings";
		this.m_htmlFriendBtn = document.createElement("button");
		this.m_htmlFriendBtn.innerText = "remove";

		this.m_htmlContainer.prepend(this.m_htmlBtnContainer);
		this.m_htmlContainer.prepend(this.m_htmlName);
		this.m_htmlContainer.prepend(this.m_htmlAvatar);

		parent.prepend(this.m_htmlContainer);

		this.setType(type);
		this.updateHtml(user);
	}


	public setType(type: UserElementType)
	{
		switch (type) {
			case UserElementType.MAIN:
				this.m_htmlBtnContainer.prepend(this.m_htmlSettingsBtn);	
				this.m_htmlBtnContainer.prepend(this.m_htmlLogoutBtn);	
				break;
			case UserElementType.FRIEND:
				this.m_htmlBtnContainer.prepend(this.m_htmlFriendBtn);	
			default:
				break;
		}
	}

	public updateHtml(user:User) : void
	{
		this.m_user = user;
		if (!user)
		{
			this.m_htmlAvatar.src = ""; // TODO: add default avatar
			this.m_htmlName.innerText = "guest";
			return ;
		}

		this.m_htmlAvatar.src = user.getAvatarPath();
		this.m_htmlName.innerText = user.name;
	}
}
