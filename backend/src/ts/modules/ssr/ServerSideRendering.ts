import { FastifyInstance } from 'fastify';
import { homePage } from './home.js';
import { loginPage } from './login.js';

export class ServerSideRendering
{
	constructor(server: FastifyInstance)
	{
		this.setupRoutes(server);
	}

	private setupRoutes(server: FastifyInstance): void
	{
		server.get('/', (request, reply) =>
		{
			reply.type('text/html').send(homePage);
		});

		server.get('/login', (request, reply) =>
		{
			reply.type('text/html').send(loginPage);
		});
	}
}
