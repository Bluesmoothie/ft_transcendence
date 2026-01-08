import { GameRouter } from '../router.js';
import { Router } from 'modules/router/Router.js';

export class TournamentMenu
{

	private router: GameRouter;
	private button1Element = document.getElementById('tournament-create') as HTMLButtonElement;
	private button2Element = document.getElementById('tournament-join') as HTMLButtonElement;

	constructor(router: GameRouter)
	{
		this.router = router;
		this.hydrateButtons();
		this.setUpDocumentEventListeners();
	}

	private hydrateButtons(): void
	{
	}

	private createTournamentClickHandler = () =>
	{
		this.router.navigateTo('tournament-create', '');
	}

	private joinTournamentClickHandler = () =>
	{
		this.router.navigateTo('tournament-join', '');
	}

	private setUpDocumentEventListeners(): void
	{
		const createBtn = document.getElementById('tournament-create');
		const joinBtn = document.getElementById('tournament-join');
		if (!createBtn || !joinBtn)
			return ;
		
		Router.addEventListener(createBtn, "click", this.createTournamentClickHandler);
		Router.addEventListener(joinBtn, "click", this.joinTournamentClickHandler);
	}

	public destroy(): void
	{
		const createBtn = document.getElementById('tournament-create');
		const joinBtn = document.getElementById('tournament-join');
		if (!createBtn || !joinBtn)
			return ;
		
		Router.removeEventListener(createBtn, "click", this.createTournamentClickHandler);
		Router.removeEventListener(joinBtn, "click", this.joinTournamentClickHandler);
	}
}
