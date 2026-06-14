// ================================================================
// Router – hash-based SPA routing
// ================================================================

import { getState, setState } from './store.js';

const routes = {};

export function registerRoute(path, handler) {
  routes[path] = handler;
}

export function navigate(path, params = {}) {
  setState('currentPage', path);
  setState('pageParams', params);
  window.history.pushState({ path, params }, '', `#${path}`);
  render();
}

export function getParams() {
  return getState('pageParams') || {};
}

function parsePath(hash) {
  if (!hash || hash === '#') return { path: 'dashboard', params: {} };
  const clean = hash.replace('#', '');
  const [path, queryStr] = clean.split('?');
  const params = {};
  if (queryStr) {
    new URLSearchParams(queryStr).forEach((v, k) => { params[k] = v; });
  }
  return { path, params };
}

export function render() {
  const page = getState('currentPage') || 'dashboard';
  const handler = routes[page];
  const content = document.getElementById('page-content');
  if (!content) return;

  if (handler) {
    const html = handler();
    const renderHtml = (h) => {
      const updateDom = () => {
        content.innerHTML = h;
        dispatchEvent(new CustomEvent('page-rendered', { detail: { page } }));
      };
      
      if (document.startViewTransition) {
        document.startViewTransition(updateDom);
      } else {
        updateDom();
        content.classList.add('page-enter');
        setTimeout(() => content.classList.remove('page-enter'), 300);
      }
    };

    if (html instanceof Promise) {
      content.innerHTML = `<div class="empty-state"><p>Loading...</p></div>`;
      html.then(h => {
        if (typeof h === 'string') {
          renderHtml(h);
        }
      }).catch(e => {
        console.error(e);
        content.innerHTML = `<div class="empty-state"><h3>Error</h3><p>${e.message}</p></div>`;
      });
    } else if (typeof html === 'string') {
      renderHtml(html);
    }
  } else {
    content.innerHTML = `
      <div class="empty-state">
        <h3>Page not found</h3>
        <p>The page "${page}" does not exist.</p>
      </div>`;
  }
}

export function initRouter() {
  window.addEventListener('popstate', () => {
    const { path, params } = parsePath(window.location.hash);
    setState('currentPage', path);
    setState('pageParams', params);
    render();
  });
}
