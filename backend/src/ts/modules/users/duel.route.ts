import * as core from 'core/core.js';
import * as duel from 'modules/users/duel.js';
import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';
import { jwtVerif } from 'modules/jwt/jwt.js';

// TODO: quand deco, delete tous les invite

export async function duelRoutes(fastify: FastifyInstance, options: FastifyPluginOptions)
{

	fastify.post('/list', {
		schema: {
			body: {
				type: 'object',
				properties: {
					token: { type: "string" }
				},
				required: ["token"]
			}
		}
	}, async (request: FastifyRequest, reply: FastifyReply) => {
			const { token } = request.body as { token: string };
			const data: any = await jwtVerif(token, core.sessionKey);
			if (!data)
				return reply.code(400).send({ message: "invalid token" });
			const res = await duel.listPendings(data.id);
			return reply.code(res.code).send(res.data);
		});

	fastify.post('/invite', {
		schema: {
			body: {
				type: 'object',
				properties: {
					token: { type: "string" },
					id: { type: "number" }
				},
				required: ["token", "id"]
			}
		}
	}, async (request: FastifyRequest, reply: FastifyReply) => {
			const { token, id } = request.body as { token: string, id: number };
			const data: any = await jwtVerif(token, core.sessionKey);
			if (!data)
				return reply.code(400).send({ message: "invalid token" });
			const res = await duel.inviteDuel(data.id, id);
			return reply.code(res.code).send(res.data);
		});

	fastify.post('/accept', {
		schema: {
			body: {
				type: 'object',
				properties: {
					token: { type: "string" },
					id: { type: "number" }
				},
				required: ["token", "id" ]
			}
		}
	}, async (request: FastifyRequest, reply: FastifyReply) => {
			const { token, id } = request.body as { token: string, id: number };
			const data: any = await jwtVerif(token, core.sessionKey);
			if (!data)
				return reply.code(400).send({ message: "invalid token" });
			const res = await duel.acceptDuel(data.id, id);
			return reply.code(res.code).send(res.data);
		});

	fastify.post('/decline', {
		schema: {
			body: {
				type: 'object',
				properties: {
					token: { type: "string" },
					id: { type: "number" }
				},
				required: ["token", "id"]
			}
		}
	}, async (request: FastifyRequest, reply: FastifyReply) => {
			const { token, id } = request.body as { token: string, id: number };
			const data: any = await jwtVerif(token, core.sessionKey);
			if (!data)
				return reply.code(400).send({ message: "invalid token" });

			const res = await duel.declineDuel(data.id, id);
			return reply.code(res.code).send(res.data);
		});
}
