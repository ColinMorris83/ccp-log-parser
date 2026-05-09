import { createHashHistory, createRootRoute, createRoute, createRouter } from '@tanstack/react-router';

import App from './App';
import CcpLogParser from './components/CcpLogParser';
import Guide from './components/Guide';

/**
 * Root route — renders the shared layout shell (theme, header, filter manager).
 * Child routes render into the `<Outlet />` inside the App component.
 */
const rootRoute = createRootRoute({
  component: App,
});

/** Index route — main CCP log parser page. */
const indexRoute = createRoute({
  component: CcpLogParser,
  getParentRoute: () => rootRoute,
  path: '/',
});

/** Guide route — built-in usage documentation. */
const guideRoute = createRoute({
  component: Guide,
  getParentRoute: () => rootRoute,
  path: '/guide',
});

const routeTree = rootRoute.addChildren([indexRoute, guideRoute]);

/**
 * Hash-based router for GitHub Pages compatibility.
 * Produces URLs like `/#/` and `/#/guide`.
 */
const hashHistory = createHashHistory();

/** Hash-based router instance for GitHub Pages compatibility. */
export const router = createRouter({
  defaultPreload: 'intent',
  history: hashHistory,
  routeTree,
});
