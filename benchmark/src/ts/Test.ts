import { randomBytes } from "node:crypto";
import { Routine } from "Routine.js";

function randomLogin(i: number)
{
	const r = randomBytes(8).toString("hex");
	const id = `${i.toString().padStart(3, '0')}`;
	const email = `test${r}${id}@test${id}.com`;
	const usr = `test${r}${id}`;
	
	return JSON.stringify({
		username: usr,
		email: email,
		passw: "123"
	});
}

export async function runTests()
{
	const req = {
		method: "POST",
		headers: { 'content-type': 'application/json' },
		body: ""
	};
	const r1 = new Routine("createUser", "/api/user/create", req, 250);
	await r1.run(200, randomLogin);
	r1.result();

}
