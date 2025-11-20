export class Tournament
{
	private nbPlayers: number = 0;

	constructor(mode: string)
	{
		this.nbPlayers = parseInt(mode, 10);
		this.init();
	}

	private init(): void
	{
		console.log(`Tournament with ${this.nbPlayers} players initialized.`);
		// TODO
	}
}
