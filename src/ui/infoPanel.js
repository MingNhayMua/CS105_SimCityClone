export function showInfoOverlay(data) {
    const overlay = document.getElementById('info-overlay');
    const title = document.getElementById('info-title');
    const body = document.getElementById('info-body');
    title.textContent = data.title;
    body.innerHTML = data.html;
    overlay.classList.remove('hidden');
}

export function hideInfoOverlay() {
    document.getElementById('info-overlay').classList.add('hidden');
}