class Game
{
	/* GAME CONSTANTS */
	private static readonly PADDLE_SPEED: number = 1.2;
	private static readonly PADDLE_HEIGHT: number = 15;
	private static readonly PADDLE_WIDTH: number = 2;
	private static readonly PADDLE_PADDING: number = 2;
	private static readonly MIN_Y_PADDLE: number = Game.PADDLE_HEIGHT / 2;
	private static readonly MAX_Y_PADDLE: number = 100 - Game.MIN_Y_PADDLE;
	private static readonly BALL_SIZE: number = 2;
	private static readonly MIN_Y_BALL: number = Game.BALL_SIZE;
	private static readonly MAX_Y_BALL: number = 100 - Game.MIN_Y_BALL;
	private static readonly MIN_X_BALL: number = Game.PADDLE_PADDING + Game.PADDLE_WIDTH + Game.MIN_Y_BALL;
	private static readonly MAX_X_BALL: number = 100 - Game.MIN_X_BALL;
	private static readonly MAX_ANGLE: number = 0.75;
	private static readonly SPEED: number = 1.0;
	private static readonly SPEED_INCREMENT: number = 0.0;
	private static readonly BACKGROUND_OPACITY: string = '0.2';
	private static readonly POINTS_TO_WIN: number = 2;
	private static readonly COUNTDOWN_TIME: number = 3;
	private static readonly COUNTDOWN_INTERVAL: number = 1000;
	private static readonly COLOR: string = '255, 255, 255';
	private static readonly PLAYER1_UP_KEY: string = 'w';
	private static readonly PLAYER1_DOWN_KEY: string = 's';
	private static readonly PLAYER2_UP_KEY: string = 'ArrowUp';
	private static readonly PLAYER2_DOWN_KEY: string = 'ArrowDown';
	private static readonly PAUSE_KEY: string = ' ';
	private static readonly PAUSE_MSG: string = `GAME PAUSED`;
	private static readonly RESUME_MSG: string = `Press ${Game.PAUSE_KEY} to continue`;
	private static readonly PLAY_AGAIN_KEY: string = 'Enter';
	private static readonly PLAY_AGAIN_MSG: string = `Press ${Game.PLAY_AGAIN_KEY} to play again`;

	/* GAME HTML ELEMENTS */
	private elements: { [key: string]: HTMLDivElement };

	/* GAME STATE */
	private keysPressed: Set<string> = new Set();
	private leftPaddleY: number = 50;
	private rightPaddleY: number = 50;
	private ballX: number = 50;
	private ballY: number = 50;
	private ballSpeedX: number = (Math.random() < 0.5) ? 0.5 : -0.5;
	private ballSpeedY: number = (Math.random() - 0.5) * 2;
	private speed: number = Game.SPEED;
	private pauseGame: boolean = false;
	private end: boolean = false;
	private spacePressed: boolean = false;
	private player1Score: number = 0;
	private player2Score: number = 0;

	constructor()
	{
		this.init();
		this.launchCountdown();
		this.normalizeSpeed();
	}

	private init(): void
	{
		this.initElements();
		this.setStyles();
		this.setOpacity('1');
	}

	private initElements(): void
	{
		this.elements =
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
		this.elements.leftPaddle.style.height = Game.PADDLE_HEIGHT + '%';
		this.elements.rightPaddle.style.height = Game.PADDLE_HEIGHT + '%';
		this.elements.leftPaddle.style.width = Game.PADDLE_WIDTH + '%';
		this.elements.rightPaddle.style.width = Game.PADDLE_WIDTH + '%';
		this.elements.leftPaddle.style.left = Game.PADDLE_PADDING + '%';
		this.elements.rightPaddle.style.right = Game.PADDLE_PADDING + '%';
		this.elements.leftPaddle.style.top = this.leftPaddleY + '%';
		this.elements.rightPaddle.style.top = this.rightPaddleY + '%';
		this.elements.ball.style.width = Game.BALL_SIZE + '%';
		this.elements.net.style.display = 'none';
		this.elements.ball.style.display = 'none';
		this.elements.scoreLeft.textContent = '0';
		this.elements.scoreRight.textContent = '0';
		this.elements.pauseMessage.style.display = 'none';
		this.elements.continueMessage.style.display = 'none';
		this.elements.winner.style.display = 'none';
		this.elements.playAgain.style.display = 'none';
	}

	private setOpacity(opacity: string): void
	{
		this.elements.leftPaddle.style.opacity = opacity;
		this.elements.rightPaddle.style.opacity = opacity;
		this.elements.net.style.opacity = opacity;
		this.elements.ball.style.opacity = opacity;
		this.elements.scoreLeft.style.opacity = opacity;
		this.elements.scoreRight.style.opacity = opacity;
		this.elements.game.style.borderColor = `rgba(${Game.COLOR}, ${opacity})`;
	}

	private launchCountdown(): void
	{
		let count = Game.COUNTDOWN_TIME;
		this.elements.countdownElement.style.display = 'block';
		this.elements.countdownElement.textContent = count.toString();

		const countdownInterval = setInterval(() =>
		{
			count--;
			if (count > 0)
			{
				this.elements.countdownElement.textContent = count.toString();
			}
			else
			{
				this.elements.net.style.display = 'block';
				this.elements.ball.style.display = 'block';
				clearInterval(countdownInterval);
				this.elements.countdownElement.style.display = 'none';
				this.setupEventListeners();
				this.gameLoop();
			}
		}, Game.COUNTDOWN_INTERVAL);
	}

	private normalizeSpeed(): void
	{
		let currentSpeed = Math.sqrt(this.ballSpeedX * this.ballSpeedX + this.ballSpeedY * this.ballSpeedY);
		this.ballSpeedX = (this.ballSpeedX / currentSpeed) * this.speed;
		this.ballSpeedY = (this.ballSpeedY / currentSpeed) * this.speed;
	}

	private setupEventListeners(): void
	{
		document.addEventListener('keydown', this.keydownHandler);
		document.addEventListener('keyup', this.keyupHandler);
	}

	private keydownHandler = (event: KeyboardEvent): void =>
	{
		console.log("Key pressed:", event.key);
		if (!this.end)
		{
			this.keysPressed.add(event.key);
			if (event.key === Game.PAUSE_KEY && !this.spacePressed)
			{
				this.spacePressed = true;
				this.pauseGame = !this.pauseGame;
				this.setOpacity(this.pauseGame ? Game.BACKGROUND_OPACITY : '1');
				this.elements.pauseMessage.textContent = Game.PAUSE_MSG;
				this.elements.pauseMessage.style.display = this.pauseGame ? 'block' : 'none';
				this.elements.continueMessage.textContent = Game.RESUME_MSG;
				this.elements.continueMessage.style.display = this.pauseGame ? 'block' : 'none';
			}
		}
		else if (event.key === Game.PLAY_AGAIN_KEY)
		{
			this.destroy();
			new Game();
		}
	}

	private keyupHandler = (event: KeyboardEvent): void =>
	{
		if (!this.end)
		{
			if (event.key === Game.PAUSE_KEY)
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
				this.moveBall();
				this.movePaddle();
			}

			requestAnimationFrame(this.gameLoop);
		}
	}

	private moveBall(): void
	{
		this.ballX += this.ballSpeedX;
		this.ballY += this.ballSpeedY;

		if (this.goal())
		{
			this.score((this.ballX > 100) ? 1 : 2);
			this.resetBall();
		}
		else if (this.collideWall())
		{
			this.ballSpeedY = -this.ballSpeedY;
			this.normalizeSpeed();
		}
		else if (this.collidePaddleLeft())
		{
			this.bounce(this.leftPaddleY, 1);
		}
		else if (this.collidePaddleRight())
		{
			this.bounce(this.rightPaddleY, -1);
		}

		this.elements.ball.style.left = this.ballX + '%';
		this.elements.ball.style.top = this.ballY + '%';
	}

	private goal(): boolean
	{
		return (this.ballX < 0 || this.ballX > 100);
	}

	private score(player: number): void
	{
		const newScore = (player === 1 ? this.player1Score : this.player2Score) + 1;
		if (player === 1)
		{
			this.player1Score = newScore;
			this.elements.scoreLeft.textContent = newScore.toString();
			this.ballSpeedX = 0.5;
		}
		else
		{
			this.player2Score = newScore;
			this.elements.scoreRight.textContent = newScore.toString();
			this.ballSpeedX = -0.5;
		}

		if (newScore >= Game.POINTS_TO_WIN)
		{
			this.end = true;
			this.showWinner(player);
		}
	}

	private resetBall(): void
	{
		this.speed = Game.SPEED;
		this.ballSpeedY = (Math.random() - 0.5) * 2;
		this.normalizeSpeed();
		this.ballX = 50;
		this.ballY = 50;
	}

	private collidePaddleLeft(): boolean
	{
		return (this.ballX <= Game.MIN_X_BALL
			&& this.ballY >= this.leftPaddleY - Game.MIN_Y_PADDLE
			&& this.ballY <= this.leftPaddleY + Game.MIN_Y_PADDLE);
	}

	private collidePaddleRight(): boolean
	{
		return (this.ballX >= Game.MAX_X_BALL
			&& this.ballY >= this.rightPaddleY - Game.MIN_Y_PADDLE
			&& this.ballY <= this.rightPaddleY + Game.MIN_Y_PADDLE);
	}

	private bounce(paddleY: number, mult: number): void
	{
		this.speed += Game.SPEED_INCREMENT;
		this.ballSpeedX = mult * Math.abs(this.ballSpeedX);
		this.ballSpeedY = (this.ballY - paddleY) / Game.MIN_Y_PADDLE * Game.MAX_ANGLE;
		this.normalizeSpeed();
	}

	private collideWall(): boolean
	{
		return (this.ballY <= Game.MIN_Y_BALL || this.ballY >= Game.MAX_Y_BALL);
	}

	private movePaddle(): void
	{
		if (this.keysPressed.has(Game.PLAYER1_UP_KEY))
		{
			this.leftPaddleY = Math.max(Game.MIN_Y_PADDLE, this.leftPaddleY - Game.PADDLE_SPEED);
		}
		if (this.keysPressed.has(Game.PLAYER1_DOWN_KEY))
		{
			this.leftPaddleY = Math.min(Game.MAX_Y_PADDLE, this.leftPaddleY + Game.PADDLE_SPEED);
		}
		if (this.keysPressed.has(Game.PLAYER2_UP_KEY))
		{
			this.rightPaddleY = Math.max(Game.MIN_Y_PADDLE, this.rightPaddleY - Game.PADDLE_SPEED);
		}
		if (this.keysPressed.has(Game.PLAYER2_DOWN_KEY))
		{
			this.rightPaddleY = Math.min(Game.MAX_Y_PADDLE, this.rightPaddleY + Game.PADDLE_SPEED);
		}

		this.elements.leftPaddle.style.top = this.leftPaddleY + '%';
		this.elements.rightPaddle.style.top = this.rightPaddleY + '%';
	}

	private showWinner(winner: number): void
	{
		this.setOpacity(Game.BACKGROUND_OPACITY);
		this.elements.net.style.display = 'none';
		this.elements.ball.style.display = 'none';
		this.elements.winner.textContent = `Player ${winner} wins !`;
		this.elements.winner.style.display = 'block';
		this.elements.playAgain.textContent = Game.PLAY_AGAIN_MSG;
		this.elements.playAgain.style.display = 'block';
	}
};
