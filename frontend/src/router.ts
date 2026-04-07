import { createRouter, createWebHistory } from 'vue-router';
import HomeView from './views/HomeView.vue';
import DebugView from './views/DebugView.vue';
import GameView from './views/GameView.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/',       component: HomeView },
    { path: '/debug',  component: DebugView },
    { path: '/game',   component: GameView },
  ],
});

export default router;
