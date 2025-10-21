var _a, _b;
class Router {
    constructor() {
        this.gameInstance = null;
        this.currentPage = 'home';
        this.pages =
            {
                home: document.querySelector('.home'),
                game: document.querySelector('.game'),
            };
        this.init();
    }
    init() {
        window.addEventListener('popstate', (e) => {
            var _a;
            const page = ((_a = e.state) === null || _a === void 0 ? void 0 : _a.page) || 'home';
            this.showPage(page, false);
        });
        window.addEventListener('keydown', (e) => {
            if (e.key === Router.EXIT_KEY && this.currentPage === 'game') {
                this.showPage('home', false);
            }
        });
        this.showPage(this.currentPage, false);
    }
    navigateTo(page, data = {}) {
        history.pushState(Object.assign({ page }, data), '', `#${page}`);
        this.showPage(page, data);
    }
    showPage(page, data = {}) {
        this.onPageChange(page, data);
        for (const key in this.pages) {
            if (this.pages.hasOwnProperty(key)) {
                this.pages[key].style.display = 'none';
            }
        }
        if (this.pages[page]) {
            this.pages[page].style.display = 'flex';
            this.currentPage = page;
        }
    }
    onPageChange(page, data) {
        if (this.currentPage === 'game' && page !== 'game' && this.gameInstance) {
            this.gameInstance.destroy();
            this.gameInstance = null;
        }
        if (page === 'game') {
            this.gameInstance = new Game();
        }
    }
}
Router.EXIT_KEY = 'Escape';
;
const router = new Router();
(_a = document.getElementById('1player')) === null || _a === void 0 ? void 0 : _a.addEventListener('click', () => {
    // TODO: AI mode
});
(_b = document.getElementById('2player')) === null || _b === void 0 ? void 0 : _b.addEventListener('click', () => {
    router.navigateTo('game', { mode: 2 });
});
