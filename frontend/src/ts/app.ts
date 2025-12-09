function loadPage(templateId)
{
	const app = document.getElementById("app");
	const template = document.getElementById(templateId) as HTMLTemplateElement;

	if (!template)
	{
		console.error("template page not found for", templateId);
		return ;
	}
	app.innerHTML = "";
	const clone = template.content.cloneNode(true);
	app.prepend(clone);

}

const routes = [
	{ path: "/", callback: () => loadPage("home-template")},
	{ path: '/about', callback: () => loadPage("about-template")},
]

class Router
{
	private routes;
	constructor(routes)
	{
		this.routes = routes;
		this._loadInitialRoute();
	}

	_getCurrentURL() {
		const path = window.location.pathname;
		return path;
	}

	_matchUrlToRoute(urlSegs) {
		const matchedRoute = this.routes.find(route => route.path === urlSegs);
		return matchedRoute;
	}

	_loadInitialRoute() {
		this.loadRoute(window.location.pathname);
	}

	loadRoute(url)
	{
		const matchRoute = this._matchUrlToRoute(url);
		if (!matchRoute)
			throw new Error(`route not found: ${url}`);
	
		matchRoute.callback();
	}

	navigateTo(path)
	{
		window.history.pushState({}, '', path);
		this.loadRoute(path);
	}
}

const router = new Router(routes);

document.getElementById("about-btn")?.addEventListener('click', () => router.navigateTo('/about'))

window.addEventListener('popstate', () => {
  router._loadInitialRoute();
});
