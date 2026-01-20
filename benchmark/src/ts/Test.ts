import { randomBytes } from "node:crypto";
import { Routine, TestResult } from "Routine.js";

type User = {
	id:		number;
	email:	string;
	name:	string;
	passw:	string;
	token:	string;
}

function getRandom(max: number)
{
	return Math.floor(Math.random() * max);
}

const users: Array<User> = [];

async function createTest(i: number): Promise<TestResult>
{
	const body = randomLogin(i);
	const res = await fetch("http://backend:3000/api/user/create", {
		method: "POST",
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(body)
	});
	users.push({ id: -1, email: body.email, name: body.username, passw: body.passw, token: "" });
	const data = await res.json();
	return { code: res.status, data: data };
}

async function tokenExchange(i: number)
{
	if (i >= users.length)
	{
		return { code: -1, data: `out of range: (${i})`}
	}

	const user = users[i];

	const res = await fetch("http://backend:3000/api/user/get_profile_token", {
		method: "POST",
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({
			token: user.token
		})
	});
	const data = await res.json();
	if (res.status == 200)
	{
		users[i].id = data.id;
	}

	return { code: res.status, data: data };
}

async function loginTest(i: number): Promise<TestResult>
{
	if (i >= users.length)
	{
		return { code: -1, data: `out of range: (${i})`}
	}

	const user = users[i];

	const res = await fetch("http://backend:3000/api/user/login", {
		method: "POST",
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({
			email: user.email,
			passw: user.passw,
			totp: "",
		})
	});
	const data = await res.json();
	if (res.status == 200)
	{
		users[i].token = data.token;
	}

	return { code: res.status, data: data };
}

async function histTest(i: number): Promise<TestResult>
{
	const user = users[i];

	const max = users.length > 15 ? 15 : users.length;
	for (let j = 0; j < max; j++)
	{
		if (j == i)
			continue;

		var r = getRandom(users.length);
		if (r == i)
			r++;

		const player = users[r];
		const score1 = getRandom(100);
		const score2 = getRandom(100);

		const res = await fetch("http://backend:3000/api/user/add_game", {
			method: "POST",
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({
				user1_id: user.id,
				user2_id: player.id,
				user1_score: score1,
				user2_score: score2
			})
		});

		if (res.status != 200)
			return { code: res.status, data: await res.json() };
	}

	return { code: 200, data: "all game added" };

}

function randomLogin(i: number)
{
	const r = randomBytes(8).toString("hex");
	const id = `${i.toString().padStart(3, '0')}`;
	const email = `test${r}${id}@test${id}.com`;
	const usr = `test${r}${id}`;
	
	return {
		username: usr,
		email: email,
		passw: "123"
	};
}

async function logout(i: number): Promise<TestResult>
{
	const user = users[i];

	const res = await fetch("http://backend:3000/api/user/logout", {
		method: "POST",
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({
			token: user.token
		})
	})
	return { code: res.status, data: await res.json()}
}

const maxUser = 100;

export async function runTests()
{
	const r1 = new Routine("CREATE_TEST", createTest, maxUser);
	const r2 = new Routine("LOGIN_USER", loginTest, maxUser);
	const r3 = new Routine("TOKEN_EXCHANGE", tokenExchange, maxUser);
	const r4 = new Routine("HISTORY", histTest, maxUser);
	const r5 = new Routine("LOGOUT", logout, maxUser);

	await r1.run(200);
	await r2.run(200);
	await r3.run(200);
	await r4.run(200);
	await r5.run(200);

	r1.result();
	r2.result();
	r3.result();
	r4.result();
	r5.result();
}
