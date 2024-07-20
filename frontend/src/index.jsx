import { h, mount } from 'destam-dom'
import { Router, Shared, Theme } from 'destamatic-ui'

import Home from './pages/Home';

const routes = {
    '/': Home,
}

window.Shared = Shared

Shared.Theme.Colours.primary.base = "#FFBE1A";
Shared.Theme.Colours.primary.baseTrans = 'rgba(255, 190, 26, 0.1)';
Shared.Theme.Colours.primary.darker = '#E8A603';
Shared.Theme.Colours.primary.lighter = '#FFC942';
Shared.Theme.Colours.primary.lightest = '#FFD263';
// Shared.Theme.Colours.secondary.lighter = '#F7F7F7';

Shared.Theme.Button.contained.base.backgroundColor = Shared.Theme.Colours.primary.base;
Shared.Theme.Button.contained.hover.backgroundColor = Shared.Theme.Colours.primary.darker;

Shared.Theme.Button.outlined.base.border = `2px solid ${Shared.Theme.Colours.primary.lighter}`;
Shared.Theme.Button.outlined.base.color = Shared.Theme.Colours.primary.base;
Shared.Theme.Button.outlined.hover.color = Shared.Theme.Colours.primary.base;
Shared.Theme.Button.outlined.hover.backgroundColor =  Shared.Theme.Colours.primary.baseTrans;

Shared.Theme.Button.text.hover.color = Shared.Theme.Colours.primary.base;
Shared.Theme.Button.text.hover.backgroundColor = Shared.Theme.Colours.primary.baseTrans;

Shared.Theme.Button.icon.hover.color = Shared.Theme.Colours.primary.base;
Shared.Theme.Button.icon.hover.backgroundColor = Shared.Theme.Colours.primary.baseTrans;

let remove;
window.addEventListener('load', () => {
	remove = mount(document.body, <Router routes={routes} Shared={Shared}/>);
});

window.addEventListener('unload', () => remove());
