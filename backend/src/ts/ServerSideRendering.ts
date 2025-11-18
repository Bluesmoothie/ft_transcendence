import { FastifyInstance } from 'fastify';
import { readFileSync } from 'fs';

const pagePath = "/var/www/server/pages/";
export class ServerSideRendering
{
	private server: FastifyInstance;

	private startPage:	string;
	private lobbyPage:	string;
	private loginPage:	string;
	private gamePage:	string;

	constructor(server: FastifyInstance)
	{
		this.server = server;
		this.setupRoutes();

		this.startPage = readFileSync(pagePath + 'start.html', 'utf8');
		this.lobbyPage = readFileSync(pagePath + 'lobby.html', 'utf8');
		this.loginPage = readFileSync(pagePath + 'login.html', 'utf8');
		this.gamePage = readFileSync(pagePath + 'game.html', 'utf8');
	}

	private setupRoutes(): void
	{
		this.server.get('/login', (request, reply) =>
		{
			reply.type('text/html').send(this.loginPage);
		});

		this.server.get('/lobby', (request, reply) =>
		{
			reply.type('text/html').send(this.lobbyPage);
		});

		this.server.get('/', (request, reply) =>
		{
			reply.type('text/html').send(this.startPage);
		});

		this.server.get('/game', (request, reply) =>
		{
			reply.type('text/html').send(this.gamePage);
		});
	}

}
