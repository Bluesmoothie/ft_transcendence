import * as core from 'core/core.js';
import { getUserById, getBlockUser, getUserStatus, getUserName } from 'modules/users/user.js';
import { WebSocket } from '@fastify/websocket';
import * as utils from 'utils.js';
import { FastifyRequest } from 'fastify';
import { GameServer } from 'modules/game/GameServer.js';
import { GameInstance } from 'modules/game/GameInstance.js'
import { Logger } from 'modules/logger.js';

// TODO: use flag in chat (e.g: if flag == DM them msg is underlined)
export const connections = new Map<WebSocket, number>(); // websocket => user login
var matchQueue: number[] = [];

export function serverMsg(str: string, data_i18n?: string): string
{
	const val = Array.from(connections.values());
	return JSON.stringify({ username: "<SERVER>", message: str, connections: val, data_i18n: data_i18n});
}

export async function sendTo(userId: number, msg: string)
{
	Logger.debug(connections.values());
	connections.forEach(async (id: number, ws: WebSocket) => {
		if (userId == id)
		{
			Logger.debug("sending msg to ", await getUserName(id));
			ws.send(msg);
		}
	});
}

async function getPlayerName(id: number) : Promise<string>
{
	const res = await getUserById(id, core.db);
	if (res.code == 200)
		return res.data.name;
	return "undifined";
}

export async function notifyMatch(id: number, opponentId: number, gameId: string, playerSide: number)
{
	const res = JSON.stringify({ username: "SERVER", message: "START", opponentId: opponentId, gameId: gameId, playerSide: playerSide});
	sendTo(id, res)
	sendTo(id, serverMsg(`you will play against: ${await getPlayerName(opponentId)}`));
}

export async function removePlayerFromQueue(playerId: number)
{
	matchQueue = matchQueue.filter(num => num != Number(playerId));
	Logger.log(`${await getUserName(playerId)} has been removed from matchQueue`);
}

export async function addPlayerToQueue(playerId: number, server: GameServer): Promise<string | null>
{
	if (matchQueue.length + 1 >= 2) // run match
	{
		const player1: number = playerId;
		const player2 = matchQueue.shift();
		if (!player2)
			return null;

		Logger.log(`${player1} will play against ${player2}`);
		const gameId = crypto.randomUUID();
		await notifyMatch(player1, player2, gameId, 1);
		await notifyMatch(player2, player1, gameId, 2);

		server.activeGames.set(gameId, new GameInstance('online', player1, player2));
		return gameId;
	}

	matchQueue.push(playerId);
	return null;
}

async function onMessage(message: any, connection: WebSocket)
{
	try
	{
		const msg = message.toString();
		await broadcast(msg, connection);
	}
	catch (err)
	{
		Logger.log(`failed to process message: ${err}`);
	}
}

export async function chatSocket(ws: WebSocket, request: FastifyRequest)
{
	try {
		ws.send(serverMsg("welcome to room chat!"));

		const id = utils.getUrlVar(request.url)["userid"];
		var res = await getUserById(id, core.db);
		var login = "Guest"; // will stay at -1 if user is not login
		if (res.code === 200)
			login = res.data.name;
		
		connections.set(ws, id);
		ws.on('message', async (message: any) => onMessage(message, ws));

		ws.on('error', (error: any) => {
			Logger.error(`${login}: websocket error: ${error}`);
		})

		ws.on('close', (code: any, reason: any) => {
			const conn = connections.get(ws);
			if (!conn)
				return ;
			removePlayerFromQueue(conn);
			broadcast(serverMsg(`${login} has left the room`), ws);
			Logger.log(`${login}: disconnected - Code: ${code}, Reason: ${reason?.toString() || 'none'}`);
			connections.delete(ws);
		});

		broadcast(serverMsg(`${login} has join the room`), ws);
	}
	catch (err)
	{
		Logger.log(`${err}`);
	}
}

async function broadcast(message: any, sender: WebSocket)
{
	const senderId = connections.get(sender);
	if (!senderId)
		return ;

	Logger.log("sending", message, connections.values());
	connections.forEach(async (id: number, conn: WebSocket) => {

		if (conn === sender || conn.readyState !== conn.OPEN)
		{
			return ;
		}
		try
		{
			const data = await getBlockUser(id, senderId);
			if (data.code == 200) // user is blocked
			{
				Logger.log(`${await getUserName(senderId)} has block ${await getUserName(id)}`);
				return;
			}
			conn.send(message);
		}
		catch (err: any)
		{
			Logger.error(`Broadcast error: ${err}`);
			connections.delete(conn);
		}
	})
}
