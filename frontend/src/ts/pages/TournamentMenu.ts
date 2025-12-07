import { Router } from '../router';

export class TournamentMenu
{
	private static readonly BUTTON_1: string = 'local';
	private static readonly BUTTON_2: string = 'online';

	private router: Router;
	private button1Element = document.getElementById('tournament-local') as HTMLButtonElement;
	private button2Element = document.getElementById('tournament-online') as HTMLButtonElement;

	constructor(router: Router)
	{
		this.router = router;
		this.hydrateButtons();
		this.setUpDocumentEventListeners();
	}

	private hydrateButtons(): void
	{
		this.button1Element.textContent = TournamentMenu.BUTTON_1;
		this.button2Element.textContent = TournamentMenu.BUTTON_2;
	}

	private localTournamentClickHandler = () =>
	{
		this.router.navigateTo('tournament', 'local');
	}

	private onlineTournamentClickHandler = () =>
	{
		this.router.navigateTo('tournament', 'online');
	}

	private setUpDocumentEventListeners(): void
	{
		document.getElementById('tournament-local')?.addEventListener('click', this.localTournamentClickHandler);
		document.getElementById('tournament-online')?.addEventListener('click', this.onlineTournamentClickHandler);
	}

	public destroy(): void
	{
		document.getElementById('tournament-local')?.removeEventListener('click', this.localTournamentClickHandler);
		document.getElementById('tournament-online')?.removeEventListener('click', this.onlineTournamentClickHandler);
	}
}
