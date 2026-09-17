import './styles/main.css';
import { Game } from './game/Game';

const root = document.querySelector<HTMLElement>('#app');
if (!root) throw new Error('Application root not found');
new Game(root);
