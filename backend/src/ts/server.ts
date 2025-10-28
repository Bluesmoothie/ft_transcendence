import fastifyStatic from '@fastify/static';
import cors from '@fastify/cors';
import Fastify from "fastify";
import sqlite3 from 'sqlite3';

import { login_user as loginUser, create_user, logout_user, set_user_status as setUserStatus, uploadAvatar } from './users/userManagment.js';
import { getFriends, getUserById, getUserByName } from './users/user.js';
import { addFriend, removeFriend, acceptFriend } from './users/friends.js';

/* directory of avatars */
export const uploadDir : string = "/var/www/avatars/"


//
// setup dependencies
//
/* setup fastify */
const fastify = Fastify({ logger: false })
await fastify.register(import('@fastify/multipart'));
await fastify.register(import('@fastify/websocket'));
await fastify.register(cors, { origin: true });


/* setup sqlite3 */
const db = new sqlite3.Database('/var/lib/sqlite/app.sqlite', sqlite3.OPEN_READWRITE, (err) => {
	if (err) {
		return console.error('Failed to connect:', err.message);
	}
});

/* root to access avatars */
fastify.register(fastifyStatic, {
  root: uploadDir,
  prefix: '/api/images/',
});


//
// Friends
//
fastify.delete('/api/remove_friend/:user1/:user2', (request, reply) => {
	return removeFriend(request, reply, db);
})

fastify.post('/api/accept_friend/:user1/:user2', (request: any, reply: any) => {
	return acceptFriend(request, reply, db);
})

fastify.post('/api/add_friend', (request:any, reply:any) => {
	return addFriend(request, reply, db);
})

//
// Users
//
fastify.get<{ Querystring: { user_id: string } }>
(
	'/api/get_friends',
	{
		schema: {
			querystring: {
				type: 'object',
				properties: {
					user_id: { type: 'string' }
				},
				required: ['user_id']
			}
		},
	handler: (request, reply) => {
		return getFriends(request, reply, db);
	}
})

fastify.get<{ Querystring: { user_id: string } }>
(
	'/api/get_profile_id',
		{
			schema: {
				querystring: {
				type: 'object',
				properties: {
					user_id: { type: 'string' }
				},
				required: ['user_id']
			}
	},
	handler: (request, reply) => {
		return getUserById(request, reply, db);
	}
})

fastify.get<{ Querystring: { profile_name: string } }>
(
	'/api/get_profile_name',
		{
			schema: {
				querystring: {
				type: 'object',
				properties: {
					profile_name: { type: 'string' }
				},
				required: ['profile_name']
			}
	},
	handler: (request, reply) => {
		return getUserByName(request, reply, db);
	}
})

//
// User managment
//
fastify.post('/api/create_user', (request: any, reply: any) => {
	return create_user(request, reply, db);
})

fastify.post('/api/login', (request:any, reply:any) => {
	return loginUser(request, reply, db);
})

fastify.post('/api/logout_user', (request: any, reply: any) => {
	return logout_user(request, reply, db);
})

fastify.post('/api/set_status', (request:any, reply:any) => {
	return setUserStatus(request, reply, db);
})

fastify.post('/api/upload/avatar', async (request, reply) => {
	return uploadAvatar(request, reply, db);
})

//
// fastify
//
const start = async () => {
	try {
		await fastify.listen({ port: 3000, host: '0.0.0.0' });
		console.log("server ready!")
	} catch (err) {
		fastify.log.error(err);
		process.exit(1)
	}
}

function shutdownDb()
{
	const sql = "UPDATE users SET is_login = 0";
	db.run(sql, function(err: any) {
		if (err)
			console.error(`error on shutdown: ${err}`);
		db.close();
		console.log('shutdown complete, bye.');
		process.exit(0);
	})
}

const signals = ['SIGINT', 'SIGTERM'] as const;
signals.forEach(signal => {
	process.on(signal, async () => {
		console.log(`Received ${signal}, shuting down...`);
		await fastify.close();
		shutdownDb();
	});
});

// to move in chat.ts
const connections = new Set();
fastify.register(async function (fastify) {
    fastify.get('/api/chat', { websocket: true }, (connection, request) => {
		const clientIp = request.socket.remoteAddress;
        console.log(`Client connected from: ${clientIp}`);
		connection.send(JSON.stringify({ username: "<server>", message: "welcome to room chat!" }));

		connections.add(connection);
		broadcast(JSON.stringify({ username: "<server>", message: `${clientIp}: has joined the room!`}), connection);
        connection.on('message', (message: any) => {
			try
			{
				const msg = message.toString();
				console.log(`${clientIp}: ${msg}`);
				broadcast(msg, connection);

				if (connection.readyState === connection.OPEN)
				{
					connection.send(`[server]: ${msg}`);
				}
			}
			catch (err)
			{
				console.log(`failed to process message: ${err}`);
			}
        });

		connection.on('error', (error: any) => {
			console.error(`${clientIp}: websocket error: ${error}`);
		})

        connection.on('close', (code: any, reason: any) => {
			connections.delete(connection);
			broadcast(JSON.stringify({ username: "<server>", message: `${clientIp}: has left the room` }), connection);
            console.log(`${clientIp}: disconnected - Code: ${code}, Reason: ${reason?.toString() || 'none'}`);
        });
    });
});

function broadcast(message: any, sender = null)
{
	connections.forEach((conn: any) => {
		if (conn !== sender && conn.readyState === conn.OPEN)
		{
			try
			{
				conn.send(message);
			}
			catch (err: any)
			{
				console.error(`Broadcast error: ${err}`);
				connections.delete(conn);
			}
		}
	})
}

start()
