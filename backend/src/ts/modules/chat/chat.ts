import { getDB } from '@core/server.js';
import { getBlockedUsrById, getUserByName, getUserStats } from '@modules/users/user.js';
import { WebSocket } from '@fastify/websocket';
import * as utils from 'utils.js';
import { FastifyRequest } from 'fastify';

const connections = new Map<WebSocket, number>(); // websocket => user login

async function handleCommand(str: string, connection) : Promise<string>
{
	const args: string[] = str.split(/\s+/);
	var response: any;
	switch (args[0])
	{
		case "/inspect":
			response = await getUserByName(args[1], getDB());
			return JSON.stringify(response.data);
		case "/stats":
			response = await getUserStats(args[1], getDB());
			return JSON.stringify(response[1]);
		case "/ping":
			return "pong";
		default:
			return "Command not found"
	}
}

async function onMessage(message: any, connection: WebSocket, clientIp: any)
{
	try
	{
		const msg = message.toString();
		const json = JSON.parse(message);
		if (json.isCmd === true)
		{
			const result = await handleCommand(json.message, connection);
			const str = JSON.stringify({
				username: "<SERVER>",
				message: result
			});
			console.log(str);
			connection.send(str);
			return ;
		}
		console.log(`${clientIp}: ${msg}`);
		await broadcast(msg, connection);
	}
	catch (err)
	{
		console.log(`failed to process message: ${err}`);
	}
}

export async function chatSocket(ws: WebSocket, request: FastifyRequest)
{

	try {
		const clientIp = request.socket.remoteAddress;
		ws.send(JSON.stringify({ username: "<SERVER>", message: "welcome to room chat!" }));


		const login = utils.getUrlVar(request.url)["login"];
		var res = await getUserByName(login, getDB());
		var id = -1; // will stay at -1 if user is not login
		if (res.code === 200)
			id = res.data.id;
		
		connections.set(ws, id);
		ws.on('message', async (message: any) => onMessage(message, ws, clientIp));

		ws.on('error', (error: any) => {
			console.error(`${clientIp}: websocket error: ${error}`);
		})

		ws.on('close', (code: any, reason: any) => {
			connections.delete(ws);
			broadcast(JSON.stringify({ username: "<SERVER>", message: `${clientIp}: has left the room` }), ws);
			console.log(`${clientIp}: disconnected - Code: ${code}, Reason: ${reason?.toString() || 'none'}`);
		});
	}
	catch (err)
	{
		console.log(err);
	}
}

async function getBlockUsr(userid: number)
{
	var blockedUsr = [];
	var res = await getBlockedUsrById(userid, getDB());
	if (res.code == 200)
		blockedUsr = res.data;
	return blockedUsr;
}

async function isBlocked(blockedUsr: any, key: WebSocket, sender: WebSocket): Promise<number>
{
	for (let i = 0; i  < blockedUsr.length; i ++)
	{
 		if (connections.get(key) == blockedUsr[i].user2_id)
		{
			console.log(connections.get(key), "is blocked by", connections.get(sender));
			return 1;
		}
	}
	return 0;
}

async function broadcast(message: any, sender: WebSocket = null)
{

	const blockedUsrSender = await getBlockUsr(connections.get(sender));
	connections.forEach(async (id: number, conn: WebSocket) => {

		if (conn === sender || conn.readyState !== conn.OPEN)
			return ;
		try
		{
			const blockedUsr = await getBlockUsr(id);
			if (await isBlocked(blockedUsrSender, conn, sender) ||
				await isBlocked(blockedUsr, sender, conn))
			{
				const val = await JSON.parse(message);
				val.message = "[REDACTED]";
				message = JSON.stringify(val);
				console.log(val);
			}
			conn.send(message);
		}
		catch (err: any)
		{
			console.error(`Broadcast error: ${err}`);
			connections.delete(conn);
		}
	})
}
