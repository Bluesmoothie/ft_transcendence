import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';

export function googleOAuth2Routes (
	app: FastifyInstance,
	options: FastifyPluginOptions,
	done: () => void,
)
{
	app.get('/api/oauth2/google/login', async function (request: FastifyRequest, reply: FastifyReply)
	{
		const { token } = await app.GoogleOAuth2.getAccessTokenFromAuthorizationCodeFlow(request);
		reply.redirect("https://localhost:8443/login.html/?access_token=" + token.access_token);
	});

	done();
}
