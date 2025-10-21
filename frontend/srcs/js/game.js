class Game {
    constructor() {
        /* GAME STATE */
        this.keysPressed = new Set();
        this.leftPaddleY = 50;
        this.rightPaddleY = 50;
        this.ballX = 50;
        this.ballY = 50;
        this.ballSpeedX = (Math.random() < 0.5) ? 0.5 : -0.5;
        this.ballSpeedY = (Math.random() - 0.5) * 2;
        this.speed = Game.SPEED;
        this.pauseGame = false;
        this.end = false;
        this.spacePressed = false;
        this.player1Score = 0;
        this.player2Score = 0;
        this.keydownHandler = (event) => {
            console.log("Key pressed:", event.key);
            if (!this.end) {
                this.keysPressed.add(event.key);
                if (event.key === Game.PAUSE_KEY && !this.spacePressed) {
                    this.spacePressed = true;
                    this.pauseGame = !this.pauseGame;
                    this.setOpacity(this.pauseGame ? Game.BACKGROUND_OPACITY : '1');
                    this.elements.pauseMessage.textContent = Game.PAUSE_MSG;
                    this.elements.pauseMessage.style.display = this.pauseGame ? 'block' : 'none';
                    this.elements.continueMessage.textContent = Game.RESUME_MSG;
                    this.elements.continueMessage.style.display = this.pauseGame ? 'block' : 'none';
                }
            }
            else if (event.key === Game.PLAY_AGAIN_KEY) {
                this.destroy();
                new Game();
            }
        };
        this.keyupHandler = (event) => {
            if (!this.end) {
                if (event.key === Game.PAUSE_KEY) {
                    this.spacePressed = false;
                }
                this.keysPressed.delete(event.key);
            }
        };
        this.gameLoop = () => {
            if (!this.end) {
                if (!this.pauseGame) {
                    this.moveBall();
                    this.movePaddle();
                }
                requestAnimationFrame(this.gameLoop);
            }
        };
        this.init();
        this.launchCountdown();
        this.normalizeSpeed();
    }
    init() {
        this.initElements();
        this.setStyles();
        this.setOpacity('1');
    }
    initElements() {
        this.elements =
            {
                game: document.querySelector('.game'),
                leftPaddle: document.querySelector('.paddle-left'),
                rightPaddle: document.querySelector('.paddle-right'),
                net: document.querySelector('.net'),
                ball: document.querySelector('.ball'),
                scoreLeft: document.querySelector('.score-left'),
                scoreRight: document.querySelector('.score-right'),
                countdownElement: document.querySelector('.countdown'),
                pauseMessage: document.querySelector('.pause-msg'),
                continueMessage: document.querySelector('.continue-msg'),
                winner: document.querySelector('.winner-msg'),
                playAgain: document.querySelector('.play-again-msg'),
            };
    }
    setStyles() {
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
    setOpacity(opacity) {
        this.elements.leftPaddle.style.opacity = opacity;
        this.elements.rightPaddle.style.opacity = opacity;
        this.elements.net.style.opacity = opacity;
        this.elements.ball.style.opacity = opacity;
        this.elements.scoreLeft.style.opacity = opacity;
        this.elements.scoreRight.style.opacity = opacity;
        this.elements.game.style.borderColor = `rgba(${Game.COLOR}, ${opacity})`;
    }
    launchCountdown() {
        let count = Game.COUNTDOWN_TIME;
        this.elements.countdownElement.style.display = 'block';
        this.elements.countdownElement.textContent = count.toString();
        const countdownInterval = setInterval(() => {
            count--;
            if (count > 0) {
                this.elements.countdownElement.textContent = count.toString();
            }
            else {
                this.elements.net.style.display = 'block';
                this.elements.ball.style.display = 'block';
                clearInterval(countdownInterval);
                this.elements.countdownElement.style.display = 'none';
                this.setupEventListeners();
                this.gameLoop();
            }
        }, Game.COUNTDOWN_INTERVAL);
    }
    normalizeSpeed() {
        let currentSpeed = Math.sqrt(this.ballSpeedX * this.ballSpeedX + this.ballSpeedY * this.ballSpeedY);
        this.ballSpeedX = (this.ballSpeedX / currentSpeed) * this.speed;
        this.ballSpeedY = (this.ballSpeedY / currentSpeed) * this.speed;
    }
    setupEventListeners() {
        document.addEventListener('keydown', this.keydownHandler);
        document.addEventListener('keyup', this.keyupHandler);
    }
    destroy() {
        this.end = true;
        document.removeEventListener('keydown', this.keydownHandler);
        document.removeEventListener('keyup', this.keyupHandler);
        this.keysPressed.clear();
    }
    moveBall() {
        this.ballX += this.ballSpeedX;
        this.ballY += this.ballSpeedY;
        if (this.goal()) {
            this.score((this.ballX > 100) ? 1 : 2);
            this.resetBall();
        }
        else if (this.collidePaddleLeft()) {
            this.bounce(this.leftPaddleY, 1);
        }
        else if (this.collidePaddleRight()) {
            this.bounce(this.rightPaddleY, -1);
        }
        else if (this.collideWall()) {
            this.ballSpeedY = -this.ballSpeedY;
            this.normalizeSpeed();
        }
        this.elements.ball.style.left = this.ballX + '%';
        this.elements.ball.style.top = this.ballY + '%';
    }
    goal() {
        return (this.ballX < 0 || this.ballX > 100);
    }
    score(player) {
        const newScore = (player === 1 ? this.player1Score : this.player2Score) + 1;
        if (player === 1) {
            this.player1Score = newScore;
            this.elements.scoreLeft.textContent = newScore.toString();
            this.ballSpeedX = 0.5;
        }
        else {
            this.player2Score = newScore;
            this.elements.scoreRight.textContent = newScore.toString();
            this.ballSpeedX = -0.5;
        }
        if (newScore >= Game.POINTS_TO_WIN) {
            this.end = true;
            this.showWinner(player);
        }
    }
    resetBall() {
        this.speed = Game.SPEED;
        this.ballSpeedY = (Math.random() - 0.5) * 2;
        this.normalizeSpeed();
        this.ballX = 50;
        this.ballY = 50;
    }
    collidePaddleLeft() {
        return (this.ballX <= Game.MIN_X_BALL
            && this.ballY >= this.leftPaddleY - Game.MIN_Y_PADDLE
            && this.ballY <= this.leftPaddleY + Game.MIN_Y_PADDLE);
    }
    collidePaddleRight() {
        return (this.ballX >= Game.MAX_X_BALL
            && this.ballY >= this.rightPaddleY - Game.MIN_Y_PADDLE
            && this.ballY <= this.rightPaddleY + Game.MIN_Y_PADDLE);
    }
    bounce(paddleY, mult) {
        this.speed += Game.SPEED_INCREMENT;
        this.ballSpeedX = mult * Math.abs(this.ballSpeedX);
        this.ballSpeedY = (this.ballY - paddleY) / Game.MIN_Y_PADDLE * Game.MAX_ANGLE;
        this.normalizeSpeed();
    }
    collideWall() {
        return (this.ballY <= Game.MIN_Y_BALL || this.ballY >= Game.MAX_Y_BALL);
    }
    movePaddle() {
        if (this.keysPressed.has(Game.PLAYER1_UP_KEY)) {
            this.leftPaddleY = Math.max(Game.MIN_Y_PADDLE, this.leftPaddleY - Game.PADDLE_SPEED);
        }
        if (this.keysPressed.has(Game.PLAYER1_DOWN_KEY)) {
            this.leftPaddleY = Math.min(Game.MAX_Y_PADDLE, this.leftPaddleY + Game.PADDLE_SPEED);
        }
        if (this.keysPressed.has(Game.PLAYER2_UP_KEY)) {
            this.rightPaddleY = Math.max(Game.MIN_Y_PADDLE, this.rightPaddleY - Game.PADDLE_SPEED);
        }
        if (this.keysPressed.has(Game.PLAYER2_DOWN_KEY)) {
            this.rightPaddleY = Math.min(Game.MAX_Y_PADDLE, this.rightPaddleY + Game.PADDLE_SPEED);
        }
        this.elements.leftPaddle.style.top = this.leftPaddleY + '%';
        this.elements.rightPaddle.style.top = this.rightPaddleY + '%';
    }
    showWinner(winner) {
        this.setOpacity(Game.BACKGROUND_OPACITY);
        this.elements.net.style.display = 'none';
        this.elements.ball.style.display = 'none';
        this.elements.winner.textContent = `Player ${winner} wins !`;
        this.elements.winner.style.display = 'block';
        this.elements.playAgain.textContent = Game.PLAY_AGAIN_MSG;
        this.elements.playAgain.style.display = 'block';
    }
}
/* GAME CONSTANTS */
Game.PADDLE_SPEED = 0.8;
Game.PADDLE_HEIGHT = 15;
Game.PADDLE_WIDTH = 2;
Game.PADDLE_PADDING = 2;
Game.MIN_Y_PADDLE = Game.PADDLE_HEIGHT / 2;
Game.MAX_Y_PADDLE = 100 - Game.MIN_Y_PADDLE;
Game.BALL_SIZE = 2;
Game.MIN_Y_BALL = Game.BALL_SIZE / 2;
Game.MAX_Y_BALL = 100 - Game.MIN_Y_BALL;
Game.MIN_X_BALL = Game.PADDLE_PADDING + Game.PADDLE_WIDTH + Game.MIN_Y_BALL;
Game.MAX_X_BALL = 100 - Game.MIN_X_BALL;
Game.MAX_ANGLE = 0.9;
Game.SPEED = 0.8;
Game.SPEED_INCREMENT = 0.0;
Game.BACKGROUND_OPACITY = '0.2';
Game.POINTS_TO_WIN = 2;
Game.COUNTDOWN_TIME = 3;
Game.COUNTDOWN_INTERVAL = 0;
Game.COLOR = '255, 255, 255';
Game.PLAYER1_UP_KEY = 'z';
Game.PLAYER1_DOWN_KEY = 's';
Game.PLAYER2_UP_KEY = 'ArrowUp';
Game.PLAYER2_DOWN_KEY = 'ArrowDown';
Game.PAUSE_KEY = ' ';
Game.PAUSE_MSG = `GAME PAUSED`;
Game.RESUME_MSG = `Press ${Game.PAUSE_KEY} to continue`;
Game.PLAY_AGAIN_KEY = 'Enter';
Game.PLAY_AGAIN_MSG = `Press ${Game.PLAY_AGAIN_KEY} to play again`;
;
