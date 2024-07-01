import { h, mount } from 'destam-dom'
import { Router, Shared } from 'destamatic-ui'

import Home from './pages/Home';

const routes = {
    '/': Home,
}

window.Shared = Shared

// Shared.Theme.colours.primary.base = "#FFB703"

let remove;
window.addEventListener('load', () => {
	remove = mount(document.body, <Router routes={routes} Shared={Shared}/>);
});

window.addEventListener('unload', () => remove());
