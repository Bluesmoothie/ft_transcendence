import { Lobby, LobbyState, Player } from 'modules/tournament/Lobby.js';
import { Logger } from 'modules/logger.js';
import { DbResponse, chat } from 'core/server.js';
import { GameServer } from 'modules/game/GameServer.js'
import { GameInstance } from "modules/game/GameInstance.js";
import { WebSocket } from '@fastify/websocket';

export class PublicLobby extends Lobby
{
	public static readonly maxEloDiff		= process.env.MAX_ELO_DIFF ? Number(process.env.MAX_ELO_DIFF) : -1;
	private m_timerId: NodeJS.Timeout | null; // used to launch match every 10sec

	constructor()
	{
		super("0", null);
		this.m_timerId = null;
		this.owner.name = "public";
	}

	public async start(id: number): Promise<DbResponse>
	{
		if (this.m_state == LobbyState.FINISHED)
			return { code: 403, data: { message: "this tournament is ended" }};
		if (this.m_state == LobbyState.STARTED)
			return { code: 403, data: { message: "this tournament is already started" }};

		this.m_state = LobbyState.STARTED;
		Logger.log(`public lobby ${this.id}: STARTING`);
		return { code: 200, data: { message: "Success" }};
	}

	public async addPlayer(id: number, ws: WebSocket | null): Promise<DbResponse>
	{
		if (!chat.isUserConnected(id))
		{
			Logger.warn(`user (id: ${id}) tried to connected to public lobby ${this.id} without connecting to chat`);
			return { code: 403, data: { message: "To access public lobby, please connect to chat" }};
		}

		const p = new Player(null);
		await p.init(id);
		this.players.add(p);
		this.toggleMatchLaunch();

		Logger.log(`adding ${p.name} to public lobby`);
		return { code: 200, data: { message: "Success" }};
	}

	private toggleMatchLaunch()
	{

	}

	private getClosestEloTo(player: Player): Player | null
	{
		if (this.players.size <= 1)
			return null;

		var closest: Player | null = null;
		for (const p of this.players)
		{
			if (p.id == player.id)
				continue;

			if (closest == null)
			{
				closest = p;
				continue;
			}

			if (Math.abs(player.elo - p.elo) < Math.abs(player.elo - closest.elo))
			{
				closest = p;
			}
		}

		return closest;
	}

	public async nextRound()
	{
		if (this.m_players.size <= 1)
		{
			Logger.log("not enought player to start public game");
			return ;
		}

		const gameId = crypto.randomUUID();
		const it = this.players.values();
		var p1: Player | undefined = it.next().value;
		if (!p1)
			return;

		var p2: Player | null = this.getClosestEloTo(p1);
		if (!p1 || !p2)
		{
			Logger.error("undefined player in queue:\n\tp1:", p1, "\n\tp2:", p2);
			return;
		}

		// const diff = Math.abs(p1.elo - p2.elo);
		// if (diff > PublicLobby.maxEloDiff)
		// {
		// 	Logger.warn(`can't start match ${p1.name} vs ${p2.name}, elo diff too big (${diff})`);
		// 	return ;
		// }

		this.m_players.delete(p1);
		this.m_players.delete(p2);

		chat.notifyMatch(p1.id, p2.id, gameId, 1);
		chat.notifyMatch(p2.id, p1.id, gameId, 2);
		GameServer.Instance?.activeGames.set(gameId, new GameInstance('online', p1.id, p2.id, gameId));

		Logger.log(`PUB LOBBY (${this.id}): NEW ROUND (${p1.name} vs ${p2.name})`);
		if (this.m_players.size > 1)
			this.nextRound();
	}
}
