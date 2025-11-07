import { promises as fs } from 'fs'
import { createUser } from '@modules/users/userManagment.js';
import { Database } from 'sqlite';
import { hashString } from '@modules/sha256.js';

export async function loadConfig(path: string, db: Database)
{
	const data = await fs.readFile(path, 'utf-8');
	const json = JSON.parse(data);

	const users = json.default_users;
	users.forEach(async (user: any) => {
		const hash = await hashString(user.passw);
		await createUser(user.email, hash, user.name, user.avatar, db);
	});
}
