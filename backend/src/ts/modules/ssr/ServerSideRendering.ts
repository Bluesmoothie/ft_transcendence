import { FastifyInstance } from 'fastify';
import { readFileSync } from 'fs';

export class ServerSideRendering
{
	private static readonly pagePath = "/var/www/server/public/";
	private static readonly cssPath = "/var/www/server/css/dist/";
	private server: FastifyInstance;

	private startPage:	string;
	private lobbyPage:	string;
	private loginPage:	string;
	private gamePage:	string;

	private startCss:	string;
	// private loginCss:	string;
	// private gameCss:	string;
	private globalCss:	string;

	constructor(server: FastifyInstance)
	{
		this.server = server;
		this.setupRoutes();

		this.startPage = readFileSync(ServerSideRendering.pagePath + 'start.html', 'utf8');
		// this.lobbyPage = readFileSync(ServerSideRendering.pagePath + 'lobby.html', 'utf8');
		// this.loginPage = readFileSync(ServerSideRendering.pagePath + 'login.html', 'utf8');
		// this.gamePage = readFileSync(ServerSideRendering.pagePath + 'game.html', 'utf8');

		// this.startCss = readFileSync(ServerSideRendering.cssPath + 'start.css', 'utf8');
		// this.globalCss = readFileSync(ServerSideRendering.cssPath + 'global.css', 'utf8');
		// this.loginCss = readFileSync(ServerSideRendering.cssPath + 'login.css', 'utf8');
	}

	private setupRoutes(): void
	{
		this.server.get('/login', (request, reply) =>
		{
			reply.type('text/html').sendFile('login.html');
		});

		this.server.get('/lobby', (request, reply) =>
		{
			reply.type('text/html').sendFile('lobby.html');
		});

		this.server.get('/', (request, reply) =>
		{
			reply.type('text/html').sendFile('start.html');
		});

		this.server.get('/game', (request, reply) =>
		{
			reply.type('text/html').sendFile('game.html');
		});

	}

}
