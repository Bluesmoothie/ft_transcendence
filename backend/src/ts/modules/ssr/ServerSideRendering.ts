import { FastifyInstance } from 'fastify';
import { readFileSync } from 'fs';

export class ServerSideRendering
{
	private server: FastifyInstance;

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

		this.server.get('/start', (request, reply) =>
		{
			reply.type('text/html').sendFile('start.html');
		});

		this.server.get('*', (request, reply) => // WARNING: this need to be the last route registered (or after all api routes)
		{
			if (request.url.startsWith("/api/")) // to api route where found previously
			{
				return reply.code(404).send({ message: 'route not found' });
			}
			reply.type('text/html').sendFile('index.html');
		});

		this.server.get('/game', (request, reply) =>
		{
			reply.type('text/html').sendFile('game.html');
		});

		this.server.get('/settings', (request, reply) =>
		{
			reply.type('text/html').sendFile('settings.html');
		})

	}

}
