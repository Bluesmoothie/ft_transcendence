const Fastify = require('fastify')
const sqlite  = require('sqlite3');

const fastify = Fastify({ logger: true })


// setup db
const db = new sqlite.Database('/var/www/server/app.sqlite', sqlite.OPEN_READWRITE, (err) => {
	if (err) {
		return console.error('Failed to connect:', err.message);
	}
});

fastify.post('/api/login', (request:any, reply:any) => {
	const { email, passw } = request.body;
	const sql = 'SELECT * FROM users WHERE email = ? AND passw = ?';


	db.get(sql, [email, passw], function (err:any, row:any) {
		if (err)
		{
			reply.code(500).send({ message: `database error: ${err.message}` });
		}
		if (!row)
		{
			reply.code(404).send({ message: "email or password invalid" });
		}
		else
		{
			reply.code(200).send(row);
		}
	})
	// reply
	// 	.code(201)
	// 	.send({ message: 'Success' });

})


fastify.post('/api/create_user', (request:any, reply:any) => {
	const { email, passw, username } = request.body;
	const sql = 'INSERT INTO users (name, email, passw) VALUES (?, ?, ?)';

	 db.run(sql, [username, email, passw], function (err:any) {
		if (err)
		{
			console.error('Insert error:', err.message);
			reply
				.code(500)
				.send({ message: `database error: ${err.message}`});
			return;
		}
		else
		{
			console.log(`Inserted row with id ${this.lastID}`);
			reply
				.code(201)
				.send({ message: `Success`});
			return;
		}
	})
})

const start = async () => {
	try {
		await fastify.listen({ port: 3000, host: '0.0.0.0' });
	} catch (err) {
		fastify.log.error(err);
		process.exit(1)
	}
}



start()
