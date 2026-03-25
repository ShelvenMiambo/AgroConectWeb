import create from 'zustand';

const useAuthStore = create((set) => ({
  user: null,

  login: (userData) => {
    set({ user: userData });
    localStorage.setItem('user', JSON.stringify(userData));
  },

  logout: () => {
    set({ user: null });
    localStorage.removeItem('user');
  },

  hydrate: () => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      set({ user: JSON.parse(storedUser) });
    }
  }
}));

// Hydrate the store with user data from localStorage on initial load
useAuthStore.getState().hydrate();

export default useAuthStore;