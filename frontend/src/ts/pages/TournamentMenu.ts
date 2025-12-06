import { Router } from '../router';

export class TournamentMenu
{
	private static readonly BUTTON_1: string = 'local';
	private static readonly BUTTON_2: string = 'online';

	private router: Router;
	private button1Element = document.getElementById('local-tournament') as HTMLButtonElement;
	private button2Element = document.getElementById('online-tournament') as HTMLButtonElement;

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
		this.router.navigateTo('Tournament', 'local');
	}

	private onlineTournamentClickHandler = () =>
	{
		this.router.navigateTo('Tournament', 'online');
	}

	private setUpDocumentEventListeners(): void
	{
		document.getElementById('local-tournament')?.addEventListener('click', this.localTournamentClickHandler);
		document.getElementById('online-tournament')?.addEventListener('click', this.onlineTournamentClickHandler);
	}

	public destroy(): void
	{
		document.getElementById('local-tournament')?.removeEventListener('click', this.localTournamentClickHandler);
		document.getElementById('online-tournament')?.removeEventListener('click', this.onlineTournamentClickHandler);
	}
}
