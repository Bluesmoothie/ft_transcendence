import sqlite3 from 'sqlite3'

export function getFriends(request: any, reply: any, db: sqlite3.Database)
{
	const { user_id } = request.query;
	const sql = "select * FROM friends where user1_id = ? or user2_id = ?;";

	db.all(sql, [user_id, user_id], function(err, rows) {
		if (err)
			return reply.code(500).send({ message: `database error ${err}` });
		if (!rows)
			return reply.code(404).send({ message: `no friend found :(` });
		return reply.code(200).send(rows);
	})
}

export function getUserById(request: any, reply: any, db: sqlite3.Database)
{
	const { user_id }  = request.query;
	const sql = 'SELECT id, name, profile_picture, elo, status, is_login FROM users WHERE id = ?';

	db.get(sql, [user_id], function (err: any, row: any) {
		if (err)
			return reply.code(500).send({ message: `database error: ${err.message}` });
		else if (!row)
			return reply.code(404).send({ message: "profile not found" });
		else
			return reply.code(200).send(row);
	})
}

export function getUserByName(request: any, reply: any, db: sqlite3.Database)
{
	const { profile_name }  = request.query;
	const sql = 'SELECT id, name, profile_picture, elo, status, is_login FROM users WHERE name = ?';

	db.get(sql, [profile_name], function (err: any, row: any) {
		if (err)
			return reply.code(500).send({ message: `database error: ${err.message}` });
		else if (!row)
			return reply.code(404).send({ message: "profile not found" });
		else
			return reply.code(200).send(row);
	})
}
