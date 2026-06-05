// ================================================================
// App Store – Reactive state management (no framework needed)
// ================================================================

const listeners = new Map();

const state = {
  currentUser: null,      // { uid, email, displayName, role, centreId }
  currentPage: 'login',
  pageParams: {},
  pendingReportsCount: 0,
  sidebarOpen: false,
};

export function getState(key) {
  return key ? state[key] : { ...state };
}

export function setState(key, value) {
  const old = state[key];
  state[key] = value;
  if (old !== value) {
    const fns = listeners.get(key) || [];
    fns.forEach(fn => fn(value, old));
    const allFns = listeners.get('*') || [];
    allFns.forEach(fn => fn({ key, value, old }));
  }
}

export function subscribe(key, fn) {
  if (!listeners.has(key)) listeners.set(key, []);
  listeners.get(key).push(fn);
  return () => {
    const arr = listeners.get(key) || [];
    const idx = arr.indexOf(fn);
    if (idx > -1) arr.splice(idx, 1);
  };
}

export function isAdmin() {
  return state.currentUser?.role === 'admin';
}

export function isTutor() {
  return state.currentUser?.role === 'tutor';
}
