// @ts-nocheck
import { GameInstance } from './GameInstance.js';
import Fastify, { FastifyInstance } from 'fastify';
import { FastifyReply } from 'fastify/types/reply';
import websocket from '@fastify/websocket';

export class GameServer
{
	private static readonly FPS: number = 60;
	private static readonly FPS_INTERVAL: number = 1000 / GameServer.FPS;

	private server!: FastifyInstance;
	private activeGames: Map<string, GameInstance> = new Map();
	private playerPending: { reply: FastifyReply, name: string } | null = null;

	constructor()
	{
		this.start();
	}

	private async start(): Promise<void>
	{
		try
		{
			this.server = Fastify()
			await this.launchServer();
			await this.server.listen({ port: 3000, host: '0.0.0.0' });
		}
		catch (error)
		{
			console.error('Error starting server:', error);
		}
	}

	private async launchServer(): Promise<void>
	{
		await this.server.register(websocket);
		this.createGame();
		this.startGame();

		this.server.get('/api/game/:gameId/:playerId', { websocket: true }, (connection, request) =>
		{
			const { gameId } = request.params as { gameId: string };
			const { playerId } = request.params as { playerId: string };
			const game = this.activeGames.get(gameId);

			if (!game)
			{
				console.error(`Game ${gameId} not found`);
				connection.close();
				return ;
			}

			const send = () =>
			{
				switch (playerId)
				{
					case '1':
						connection.send(game.state);
						break ;
					case '2':
						connection.send(game.reversedState);
						break ;
					default:
						connection.close();
				}

				const winner = game?.winnerName;
				if (winner)
				{
					connection.send(JSON.stringify({ type: 'winner', winner }));
				}
			};

			const interval = setInterval(send, GameServer.FPS_INTERVAL);

			connection.on('message', (message) =>
			{
				try
				{
					let keysPressed: Set<string>;
					const msg = message.toString();

					if (game.mode === '1player')
					{
						keysPressed = new Set(Array.from(msg).map(key => playerId + key));
					}
					else if (game.mode === '2player')
					{
						keysPressed = new Set(msg.match(/../g));
					}

					game.handleKeyPress(keysPressed);
				}
				catch (error)
				{
					console.error('Error parsing message:', error);
				}
			});

			const closeConnection = (): void =>
			{
				clearInterval(interval);
				game.destroy();
				this.activeGames.delete(gameId);
			};

			connection.on('close', () =>
			{
				closeConnection();
			});

			connection.on('error', () =>
			{
				console.error(`Connection error for game ${gameId}`);
				closeConnection();
			});
		});
	}

	private createGame(): void
	{
		this.server.post('/api/create-game', (request, reply) =>
		{
			try
			{
				const body = request.body as { mode: string; playerName: string };
				const mode = body.mode;
				const name = body.playerName;

				if (mode === '1player')
				{
					if (this.playerPending)
					{
						const gameId = crypto.randomUUID();
						this.playerPending.reply.status(201).send({ gameId, opponentName: name, playerId: 1 });
						reply.status(201).send({ gameId, opponentName: this.playerPending.name, playerId: 2 });
						this.activeGames.set(gameId, new GameInstance(mode, this.playerPending.name, name));
						this.playerPending = null;
					}
					else
					{
						this.playerPending = { reply, name };
					}
				}
				else if (mode === '2player')
				{
					const gameId = crypto.randomUUID();
					const opponentName = 'Guest';
					const game = new GameInstance(mode, name, opponentName);
					this.activeGames.set(gameId, game);
					reply.status(201).send({ gameId, opponentName, playerId: '1' });
				}
				else
				{
					reply.status(400).send({ error: 'Invalid game mode' });
				}
			}
			catch (error)
			{
				console.error('Error creating game:', error);
				reply.status(500).send();
			}
		});
	}

	private startGame(): void
	{
		this.server.post('/api/start-game/:gameId', (request, reply) =>
		{
			try
			{
				const { gameId } = request.params as { gameId: string };
				const game = this.activeGames.get(gameId);

				if (!game)
				{
					reply.status(404).send({ error: 'Game not found' });
					return ;
				}

				game.running = true;
				reply.status(200).send({ message: 'Game started' });
			}
			catch (error)
			{
				console.error('Error creating game:', error);
				reply.status(500).send();
			}
		});
	}
}
