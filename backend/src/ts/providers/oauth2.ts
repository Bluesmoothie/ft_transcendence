import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import OAuth2, { OAuth2Namespace } from '@fastify/oauth2';
import { FastifyOAuth2Options } from '@fastify/oauth2';

declare module 'fastify' {
	interface FastifyInstance {
		GoogleOAuth2: OAuth2Namespace;
	}
}

const GoogleOAuth2Options : FastifyOAuth2Options = {
	name: 'GoogleOAuth2',
	scope: [ "profile", "email" ],
	credentials: {
		client: {
			id: "1037879128761-jrqfe4ealp6ovtorl6hgo67r8qfscuk2.apps.googleusercontent.com",
			secret: "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"
		},
		auth: OAuth2.GOOGLE_CONFIGURATION
	},
	startRedirectPath: "/api/oauth2/google", // create a new get route to log using google
	callbackUri: "http://localhost:3000/oauth2/google/callback", // callback after login
	// generateStateFunction: (request: FastifyRequest, Reply: FastifyReply) => {
	// 	// must us ts-ignore or false error
	// 	// @ts-ignore
	// 	return request.query.state;
	// },
	// checkStateFunction: (request: FastifyRequest, callback: any) => {
	// 	// must us ts-ignore or false error
	// 	// @ts-ignore
	// 	if (request.query.state)
	// 	{
	// 		callback();
	// 		return ;
	// 	}
	// 	callback(new Error("Invalid state"));
	// }
};


export function registerOAuth2GoogleProvider(app: FastifyInstance)
{
	app.register(OAuth2, GoogleOAuth2Options);
}

