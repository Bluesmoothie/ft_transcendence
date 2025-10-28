import { strToCol } from './sha256.js';
import { User, UserStatus } from './User.js'

// *********************** TODO *********************** //
// send to all
// send to user
// trigger cmd (/cmd arg1 arg2)
// **************************************************** //

function applyMsgStyle(msg: string) : string
{
	return `[${msg}]`;
}

class Message
{
	private m_sender:	User;
	private m_msg:		string;
	private m_isCmd:	boolean;

	constructor(sender: User, msg: string)
	{
		this.m_sender = sender;
		this.m_msg = msg;

		this.m_isCmd = false; // TODO: handle cmd
	}

	public getSender() : User	{ return this.m_sender; }
	public getMsg() : string	{ return this.m_msg; }
	public isCmd() : boolean	{ return this.m_isCmd; }

	public sendToAll(ws: WebSocket)
	{
		const packet = { username: this.m_sender.name, message: this.m_msg };
		ws.send(JSON.stringify(packet));
	}

	public toHtml(className: string) : HTMLElement
	{
		const container = document.createElement("div");
		container.className = className;

		const senderTxt = document.createElement("h1");
		senderTxt.innerText = applyMsgStyle(this.m_sender.name);
		senderTxt.style.color = strToCol(this.m_sender.name);

		const msg = document.createElement("p");
		msg.innerText = this.getMsg();

		container.prepend(msg);
		container.prepend(senderTxt);
		
		return container;
	}

	public execCommand()
	{
		// handle command
	}
};

export class Chat
{
	private m_chatlog:		Message[];

	private m_chatbox:		HTMLElement;
	private m_chatInput:	HTMLInputElement;
	private m_user:			User;
	private	m_ws:			WebSocket;

	constructor(user: User, chatbox: HTMLElement, chatInput: HTMLInputElement)
	{
		if (!chatbox || !chatInput || !user)
		{
			console.error("chatbox, user or chatInput invalid");
			return ;
		}
		this.m_chatbox = chatbox;
		this.m_chatInput = chatInput;
		this.m_user = user;
		this.m_chatlog = [];

		console.log(`connecting to chat websocket: ${window.location.host}`)
		this.m_ws = new WebSocket(`wss://${window.location.host}/api/chat`);

		this.m_ws.onmessage = (event:any) => this.receiveMessage(event);
		chatInput.addEventListener("keypress", (e) => this.sendMsgFromInput(e));
	}
	public getChatlog(): Message[]	{ return this.m_chatlog; }

	private sendMsgFromInput(event:any)
	{
		if (event.key == 'Enter')
		{
			this.sendMsg(this.m_user, this.m_chatInput.value);
			this.m_chatInput.value = "";
		}
	}

	private receiveMessage(event:any)
	{
		const json = JSON.parse(event.data);
		const username = json.username;
		const message = json.message;

		const user = new User();
		user.setUser(-1, username, "", "", UserStatus.UNKNOW); // TODO: ajouter un user.ToJSON() et envoyer toutes les infos au serv
		const newMsg = new Message(user, message);

		this.m_chatbox.prepend(newMsg.toHtml("user-msg"));
		this.m_chatlog.push(newMsg);
	}


	public sendMsg(sender: User, msg: string)
	{
		var newMsg = new Message(sender, msg);
		if (newMsg.isCmd())
		{
			newMsg.execCommand();
			return ;
		}

		newMsg.sendToAll(this.m_ws);
		this.m_chatbox.prepend(newMsg.toHtml("user-msg"));
		this.m_chatlog.push(newMsg);
	}
}


