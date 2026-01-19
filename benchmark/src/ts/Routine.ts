import { Logger } from "Logger.js";

export class Routine
{
	private m_req: any;
	private m_url: string;
	private m_name: string;
	private m_iter: number;
	private m_success: number = 0;

	private m_start: any;
	private m_end: any;

	constructor(name: string, url: string, req: any, iter: number)
	{
		this.m_name = name;
		this.m_req = req;
		this.m_url = url;
		this.m_iter = iter;
	}

	public async run(expetedCode: number, bodyFunction?: (i: number) => any): Promise<number>
	{
		this.m_start = performance.now();
		for (var i = 0; i < this.m_iter; i++)
		{
			try
			{
				var req = this.m_req;
				if (bodyFunction)
					req.body = bodyFunction(i);

				const res = await fetch(`http://backend:3000${this.m_url}`, this.m_req);
				if (res.status == expetedCode)
				{
					Logger.success(`${this.m_url.padEnd(25, '.')}: ${res.status} OK`);
					this.m_success++;
				}
				else
				{
					const json = await res.json();
					Logger.error(`${this.m_url.padEnd(25, '.')}: ${res.status} ERR`);
					Logger.error(`\tinfo: ${JSON.stringify(json, null, 2)}`);
				}
			}
			catch (err)
			{
				Logger.error(`${this.m_name}: failed to connect to ${this.m_url}, aborting.`);
				this.m_end = performance.now();
				return 1;
			}
		}
		this.m_end = performance.now();
		return 0;
	}

	public result()
	{
		const success = this.m_success == this.m_iter;
		Logger.log("");
		Logger.log(`+++ ${this.m_name.toUpperCase()} +++`);
		if (success)
			Logger.success(`${this.m_success}/${this.m_iter.toString().padEnd(15, '.')}: SUCCESS`);
		else
			Logger.error(`${this.m_success}/${this.m_iter.toString().padEnd(15, '.')}: SUCCESS`);
		Logger.log(`${this.m_name} took ${this.m_end - this.m_start}ms to complete`);
		Logger.log(`++++\n`);
	}
}
