import { GameClient } from './GameClient';

export class Tournament
{
	private button: HTMLButtonElement | null = null;
	private playerInput: HTMLInputElement | null = null;
	private players: Set<string> = new Set();
	private matches: Array<[string, string]> = [];

	private static readonly MAX_PLAYERS: number = 32;

	constructor(mode: string)
	{
		if (mode === 'local')
		{
			this.init();
		}
	}

	private init(): void
	{
		console.log('Initializing Tournament instance.');
		this.button = document.getElementById('tournament-start') as HTMLButtonElement;
		this.playerInput = document.getElementById('tournament-players') as HTMLInputElement;
		this.setUpEventsListeners();
	}

	private setUpEventsListeners(): void
	{
		if (this.button)
		{
			this.button.classList.remove('hidden');
			this.button!.addEventListener('click', this.startTournament);
		}

		if (this.playerInput)
		{
			this.playerInput.classList.remove('hidden');
			this.playerInput!.addEventListener('change', this.playerInputHandler);
		}
	}

	private playerInputHandler: (event: Event) => void = (event) =>
	{
		const target = event.target as HTMLInputElement;
		if (target && target.value.trim() !== '')
		{
			this.players.add(target.value);
			console.log(`Player added: ${target.value}, new total: ${this.players.size}`);
			target.value = '';

			if (this.players.size === Tournament.MAX_PLAYERS)
			{
				this.startTournament();
			}
		}
	};

	private startTournament = () =>
	{
		if (this.button)
		{
			this.button.classList.add('hidden');
		}
		if (this.playerInput)
		{
			this.playerInput.classList.add('hidden');
		}

		const nbBot = (this.players.size === 1) ? 1 : Math.pow(2, Math.ceil(Math.log2(this.players.size))) - this.players.size;
		console.log(`Adding ${nbBot} bot(s) to complete the tournament bracket.`);
		for (let i = 0; i < nbBot; i++)
		{
			this.players.add(`Bot_${i + 1}`);
		}

		for (const player of this.players)
		{
			console.log(`Participant: ${player}`);
		}

		while (this.players.size > 1)
		{
			this.generateMatches();
			this.playMatches();
		}
	}

	private generateMatches(): void
	{
		this.matches = [];
		const shuffledPlayers = this.shuffleArray(Array.from(this.players));

		for (let i = 0; i < shuffledPlayers.length; i += 2)
		{
			this.matches.push([shuffledPlayers[i], shuffledPlayers[i + 1]]);
		}
	}

	private shuffleArray<T>(array: T[]): T[]
	{
		for (let i = array.length - 1; i > 0; i--)
		{
			const j = Math.floor(Math.random() * (i + 1));
			[array[i], array[j]] = [array[j], array[i]];
		}

		return (array);
	}

	private playMatches(): void
	{
		console.log('Starting a new round of matches.');

		for (const [player1, player2] of this.matches)
		{
			console.log(`Match: ${player1} vs ${player2}`);

			// new GameClient(null, 'local', null, null);

			console.log(`Winner: ${player1}`);
			this.players.delete(player2);
		}
	}

	public destroy(): void
	{
		console.log('Destroying Tournament instance.');

		if (this.button)
		{
			this.button.removeEventListener('click', this.startTournament);
		}

		if (this.playerInput)
		{
			this.playerInput.removeEventListener('change', this.playerInputHandler);
		}
	}
}
