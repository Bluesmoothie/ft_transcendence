import { GameRouter } from '../router';

export class GameMenu
{

	private router: GameRouter;

	constructor(router: GameRouter)
	{
		this.router = router;
		this.setUpDocumentEventListeners();
	}

	private localGameClickHandler = () =>
	{
		this.router.navigateTo('game', 'local');
	}

	private onlineGameClickHandler = () =>
	{
		this.router.navigateTo('game', 'online');
	}

	private botGameClickHandler = () =>
	{
		this.router.navigateTo('game', 'bot');
	}

	private setUpDocumentEventListeners(): void
	{
		document.getElementById('local-game')?.addEventListener('click', this.localGameClickHandler);
		document.getElementById('online-game')?.addEventListener('click', this.onlineGameClickHandler);
		document.getElementById('bot-game')?.addEventListener('click', this.botGameClickHandler);
	}

	public destroy(): void
	{
		document.getElementById('local-game')?.removeEventListener('click', this.localGameClickHandler);
		document.getElementById('online-game')?.removeEventListener('click', this.onlineGameClickHandler);
		document.getElementById('bot-game')?.removeEventListener('click', this.botGameClickHandler);
	}
}
