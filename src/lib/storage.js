// localStorage can throw (Safari private mode, blocked cookies). Never let that
// take the app down; fall back to an in-memory value for the session.
const memory = new Map();

export const storage = {
  get(key) {
    try {
      return window.localStorage.getItem(key) ?? memory.get(key) ?? null;
    } catch {
      return memory.get(key) ?? null;
    }
  },
  set(key, value) {
    memory.set(key, value);
    try {
      window.localStorage.setItem(key, value);
    } catch {
      /* in-memory copy is enough */
    }
  },
  remove(key) {
    memory.delete(key);
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  },
  getJSON(key) {
    try {
      return JSON.parse(this.get(key));
    } catch {
      return null;
    }
  },
};
