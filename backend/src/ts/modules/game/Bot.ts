import { GameState } from './GameState.js';
import WebSocket from 'ws';

export class Bot
{
	private static readonly PLAYER_ID: string = '2';
	private static readonly IPS: number = 100;
	private static readonly INTERVAL_TIME: number = 1000 / Bot.IPS;

	private socket: WebSocket;
	private interval: NodeJS.Timeout | null = null;
	private gameState: GameState | null = null;
	private keysPressed: Set<string> = new Set();

	constructor (gameId: string)
	{
		this.start(gameId);
	}

	private start(gameId: string): void
	{
		this.socket = new WebSocket(`ws://localhost:3000/api/game/${gameId}/${Bot.PLAYER_ID}`);
		this.socket.binaryType = 'arraybuffer';

		this.socket.onopen = () =>
		{
			this.interval = setInterval(() => { this.send(); }, Bot.INTERVAL_TIME);
		};

		this.socket.onmessage = (event) =>
		{
			this.updateGameState(event.data);
		};

		this.socket.onclose = () =>
		{
			this.stopGameLoop();
		};

		this.socket.onerror = (error) =>
		{
			console.error('WebSocket error:', error);
			this.stopGameLoop();
		};
	}

	private updateGameState(data: string | ArrayBuffer): void
	{
		if (typeof data === 'string')
		{
			const message = JSON.parse(data);
			if (message.type === 'winner')
			{
				this.destroy();
			}
		}
		else
		{
			this.gameState = new GameState(data);
		}
	}

	private send(): void
	{
		// TODO
	}

	private stopGameLoop(): void
	{
		if (this.interval)
		{
			clearInterval(this.interval);
		}
	}

	public destroy(): void
	{
		this.socket?.close();
		this.stopGameLoop();
		this.keysPressed.clear();
	}
};
