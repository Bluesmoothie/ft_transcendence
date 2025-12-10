import { GameRouter } from '../router';

export class Home
{
	private router: GameRouter;

	constructor(router: GameRouter)
	{
		this.router = router;
		this.setUpDocumentEventListeners();
	}

	private menuGameClickHandler = () =>
	{
		this.router.navigateTo('game-menu', '');
	}

	private menuTournamentClickHandler = () =>
	{
		this.router.navigateTo('tournament-menu', '');
	}

	private setUpDocumentEventListeners(): void
	{
		document.getElementById('game')?.addEventListener('click', this.menuGameClickHandler);
		document.getElementById('tournament')?.addEventListener('click', this.menuTournamentClickHandler);
	}

	public destroy(): void
	{
		document.getElementById('game')?.removeEventListener('click', this.menuGameClickHandler);
		document.getElementById('tournament')?.removeEventListener('click', this.menuTournamentClickHandler);
	}
}
