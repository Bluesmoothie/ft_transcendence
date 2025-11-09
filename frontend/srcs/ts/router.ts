// @ts-ignore
import { GameClient } from './GameClient.js';

export class Router
{
	private static readonly EXIT_KEY: string = 'Escape';
	private static readonly homeButton1: string = 'one player';
	private static readonly homeButton2: string = 'two player';
	private button1Element = document.getElementById('1player');
	private button2Element = document.getElementById('2player');

	currentPage: string = 'home';
	pages: Map<string, HTMLElement> = new Map();
	gameInstance: GameClient | null = null;

	constructor()
	{
		this.detectInitialPage();
		this.loadPages();
		this.setupEventListeners();
	}

	private detectInitialPage(): void
	{
		const homeElement = document.querySelector('.home');
		const gameElement = document.querySelector('.game');

		if (gameElement && this.isElementVisible(gameElement))
		{
			this.currentPage = 'game';
			const urlParams = new URLSearchParams(window.location.search);
			const mode = urlParams.get('mode') || '1player';
			this.gameInstance = new GameClient(mode);
		}
		else if (homeElement && this.isElementVisible(homeElement))
		{
			this.currentPage = 'home';
			this.hydrateHomeButtons();
		}
	}

	private isElementVisible(element: Element): boolean
	{
		const style = window.getComputedStyle(element);
		return style.display !== 'none' && style.visibility !== 'hidden';
	}

	private hydrateHomeButtons(): void
	{
		if (this.button1Element && this.button2Element)
		{
			this.button1Element.textContent = Router.homeButton1;
			this.button2Element.textContent = Router.homeButton2;
		}
	}

	private loadPages(): void
	{
		const pageElements = document.querySelectorAll('section');
		pageElements.forEach(element =>
		{
			const pageName = element.getAttribute('class');
			if (pageName)
			{
				this.pages.set(pageName, element as HTMLElement);
			}
		});
	}

	private setupEventListeners(): void
	{
		window.addEventListener('popstate', (e) =>
		{
			this.handlePopState();
		});

		window.addEventListener('keydown', (e) =>
		{
			if (e.key === Router.EXIT_KEY && this.currentPage === 'game')
			{
				this.navigateTo('home', null);
			}
		});

		document.getElementById('1player')?.addEventListener('click', () =>
		{
			this.navigateTo('game', '1player');
		});

		document.getElementById('2player')?.addEventListener('click', () =>
		{
			this.navigateTo('game', '2player');
		});

		console.log('🎯 Event listeners configurés');
	}

	private handlePopState(): void
	{
		const path = window.location.pathname;
		const urlParams = new URLSearchParams(window.location.search);
		const mode = urlParams.get('mode');

		let page = 'home';
		if (path === '/game') page = 'game';

		console.log(`🔙 Navigation popstate vers: ${page}`, { mode });
		this.showPage(page, mode);
	}

	private showPage(page: string, mode: string): void
	{
		if (this.currentPage === 'game' && page !== 'game' && this.gameInstance)
		{
			console.log('🛑 Arrêt du jeu précédent');
			this.gameInstance.destroy();
			this.gameInstance = null;
		}

		if (page === 'home')
		{
			this.hydrateHomeButtons();
		}
		else if (page === 'game')
		{
			const gameMode = mode || '1player';
			console.log(`🎮 Démarrage jeu mode: ${gameMode}`);
			this.gameInstance = new GameClient(gameMode);
		}
	}

	public navigateTo(page: string, mode: string): void
	{
		const url = `/${page}${mode ? `?mode=${mode}` : ''}`;
		history.pushState({ page, mode }, '', url);
		this.showPage(page, mode);
	}
}

document.addEventListener('DOMContentLoaded', () =>
{
	new Router();
});
