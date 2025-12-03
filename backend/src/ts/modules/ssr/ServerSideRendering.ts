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
	}

	private setupRoutes(): void
	{
		this.server.get('/login', (request, reply) =>
		{
			reply.type('text/html').sendFile('login.html');
		});

		this.server.get('/profile', (request, reply) =>
		{
			reply.type('text/html').sendFile('profile.html');
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
