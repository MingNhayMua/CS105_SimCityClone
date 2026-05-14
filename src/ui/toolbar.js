import { LANDMARK_CATALOG } from '../assets/landmarkCatalog.js';

let selectedControl = document.getElementById('button-mouse');

export function setActiveTool(event, toolID, game) {
    if (selectedControl) {
        selectedControl.classList.remove('selected');
    }
    selectedControl = event.currentTarget;
    selectedControl.classList.add('selected');
    game.setActiveToolID(toolID);

    const picker = document.getElementById('landmark-picker');
    if (toolID === 'landmark') {
        if (picker && !picker.querySelector('.lp-item')) {
            const categories = [...new Set(LANDMARK_CATALOG.map(l => l.category))];
            const body = document.getElementById('landmark-picker-body');
            if (body) {
                body.innerHTML = categories.map(cat => `
                    <div class="lp-category">
                        <div class="lp-category-title">${cat}</div>
                        <div class="lp-items">
                            ${LANDMARK_CATALOG.filter(l => l.category === cat).map(l => `
                                <button class="lp-item" onclick="selectLandmark('${l.id}')" title="${l.name}" id="lp-${l.id}">
                                    <span class="lp-icon">${l.icon}</span>
                                    <span class="lp-name">${l.name}</span>
                                </button>
                            `).join('')}
                        </div>
                    </div>
                `).join('');
            }
        }
        picker?.classList.remove('hidden');
    } else {
        picker?.classList.add('hidden');
    }
}

export function togglePause(game) {
    game.togglePause();
    const btn = document.getElementById('button-pause');
    if (game.isPaused()) {
        btn.innerHTML = '<img src="/Icons/icons8-play-50.png" class="btn-icon-img" alt="Resume">';
        btn.classList.add('paused');
    } else {
        btn.innerHTML = '<img src="/Icons/icons8-pause-50.png" class="btn-icon-img" alt="Pause">';
        btn.classList.remove('paused');
    }
}