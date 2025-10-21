import { fastify, FastifyInstance } from 'fastify';
import websocket from '@fastify/websocket';

class GameClient
{
	private HTMLelements: { [key: string]: HTMLDivElement };
	private keysPressed: Set<string> = new Set();
	private gameState: any;

	private setupServer(): void
	{
		const server = fastify();
		server.register(websocket);

		server.register(async (fastify) =>
		{
			fastify.get('/game', { websocket: true } as any, (connection: any, req: any) =>
			{
				this.players.set(connection.socket, `player`);

				connection.socket.on('message', (message: Buffer) =>
				{
					const data = JSON.parse(message.toString());
					this.handleClientInput(data);
				});

				connection.socket.on('close', () =>
				{
					this.players.delete(connection.socket);
				});
			});
		});
	}

	constructor()
	{
		this.init();
		this.launchCountdown();
		this.connectToServer();
	}

	private init(): void
	{
		this.initElements();
		this.setStyles();
		this.setOpacity('1');
	}

	private initElements(): void
	{
		this.HTMLelements =
		{
			game: document.querySelector('.game') as HTMLDivElement,
			leftPaddle: document.querySelector('.paddle-left') as HTMLDivElement,
			rightPaddle: document.querySelector('.paddle-right') as HTMLDivElement,
			net: document.querySelector('.net') as HTMLDivElement,
			ball: document.querySelector('.ball') as HTMLDivElement,
			scoreLeft: document.querySelector('.score-left') as HTMLDivElement,
			scoreRight: document.querySelector('.score-right') as HTMLDivElement,
			countdownElement: document.querySelector('.countdown') as HTMLDivElement,
			pauseMessage: document.querySelector('.pause-msg') as HTMLDivElement,
			continueMessage: document.querySelector('.continue-msg') as HTMLDivElement,
			winner: document.querySelector('.winner-msg') as HTMLDivElement,
			playAgain: document.querySelector('.play-again-msg') as HTMLDivElement,
		};
	}

	private setStyles(): void
	{
		this.HTMLelements.net.style.display = 'none';
		this.HTMLelements.ball.style.display = 'none';
		this.HTMLelements.scoreLeft.textContent = '0';
		this.HTMLelements.scoreRight.textContent = '0';
		this.HTMLelements.pauseMessage.style.display = 'none';
		this.HTMLelements.continueMessage.style.display = 'none';
		this.HTMLelements.winner.style.display = 'none';
		this.HTMLelements.playAgain.style.display = 'none';
	}

	private setOpacity(opacity: string): void
	{
		this.HTMLelements.leftPaddle.style.opacity = opacity;
		this.HTMLelements.rightPaddle.style.opacity = opacity;
		this.HTMLelements.net.style.opacity = opacity;
		this.HTMLelements.ball.style.opacity = opacity;
		this.HTMLelements.scoreLeft.style.opacity = opacity;
		this.HTMLelements.scoreRight.style.opacity = opacity;
		this.HTMLelements.game.style.borderColor = `rgba(${GameClient.COLOR}, ${opacity})`;
	}

	private launchCountdown(): void
	{
		let count = GameClient.COUNTDOWN_TIME;
		this.HTMLelements.countdownElement.style.display = 'block';
		this.HTMLelements.countdownElement.textContent = count.toString();

		const countdownInterval = setInterval(() =>
		{
			count--;
			if (count > 0)
			{
				this.HTMLelements.countdownElement.textContent = count.toString();
			}
			else
			{
				this.HTMLelements.net.style.display = 'block';
				this.HTMLelements.ball.style.display = 'block';
				clearInterval(countdownInterval);
				this.HTMLelements.countdownElement.style.display = 'none';
				this.setupEventListeners();
				this.gameLoop();
			}
		}, GameClient.COUNTDOWN_INTERVAL);
	}

	private setupEventListeners(): void
	{
		document.addEventListener('keydown', this.keydownHandler);
		document.addEventListener('keyup', this.keyupHandler);
	}

	private keydownHandler = (event: KeyboardEvent): void =>
	{
		if (!this.end)
		{
			this.keysPressed.add(event.key);
			{
				this.spacePressed = true;
				this.pauseGame = !this.pauseGame;
				this.setOpacity(this.pauseGame ? GameClient.BACKGROUND_OPACITY : '1');
				this.HTMLelements.pauseMessage.textContent = GameClient.PAUSE_MSG;
				this.HTMLelements.pauseMessage.style.display = this.pauseGame ? 'block' : 'none';
				this.HTMLelements.continueMessage.textContent = GameClient.RESUME_MSG;
				this.HTMLelements.continueMessage.style.display = this.pauseGame ? 'block' : 'none';
			}
			{
				this.socket.send(JSON.stringify({ key: event.key, type: 'keydown' }));
			}
		}
		else if (event.key === GameClient.PLAY_AGAIN_KEY)
		{
			this.destroy();
			new GameClient();
		}
	}

	private keyupHandler = (event: KeyboardEvent): void =>
	{
		if (!this.end)
		{
			if (event.key === GameClient.PAUSE_KEY)
			{
				this.spacePressed = false;
			}

			this.keysPressed.delete(event.key);
		}
	}

	public destroy(): void
	{
		this.end = true;
		document.removeEventListener('keydown', this.keydownHandler);
		document.removeEventListener('keyup', this.keyupHandler);
		this.keysPressed.clear();
	}

	private gameLoop = (): void =>
	{
		if (!this.end)
		{
			if (!this.pauseGame)
			{
			}

			requestAnimationFrame(this.gameLoop);
		}
	}

	private connectToServer(): void
	{
		this.socket = new WebSocket('ws://localhost:8443/game');

		this.socket.onmessage = (event: MessageEvent) =>
		{
			this.gameState = JSON.parse(event.data);
		};
	}

	private showWinner(winner: number): void
	{
		this.setOpacity(GameClient.BACKGROUND_OPACITY);
		this.HTMLelements.net.style.display = 'none';
		this.HTMLelements.ball.style.display = 'none';
		this.HTMLelements.winner.textContent = `Player ${winner} wins !`;
		this.HTMLelements.winner.style.display = 'block';
		this.HTMLelements.playAgain.textContent = GameClient.PLAY_AGAIN_MSG;
		this.HTMLelements.playAgain.style.display = 'block';
	}
};
