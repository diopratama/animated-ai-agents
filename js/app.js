// ═══════════════════════════════════════════════════════
//  APP BOOT & ROUTING
// ═══════════════════════════════════════════════════════

function switchTab(tab) {
    location.hash = tab;
}

function applyRoute() {
    const hash = location.hash.replace('#', '') || 'agents';
    const tabs = document.querySelectorAll('header .tab');
    tabs.forEach(t => t.classList.remove('active'));

    const mainView = document.getElementById('mainView');
    const settingsPanel = document.getElementById('settingsPanel');

    if (hash === 'settings') {
        tabs[2].classList.add('active');
        mainView.style.display = 'none';
        settingsPanel.classList.add('visible');
        buildSettingsForm();
        const modelSel = document.getElementById('modelSelect');
        if (modelSel) modelSel.value = selectedModel;
    } else {
        tabs[hash === 'layout' ? 1 : 0].classList.add('active');
        mainView.style.display = '';
        settingsPanel.classList.remove('visible');
    }
}

window.addEventListener('hashchange', applyRoute);

// ─── Folder Picker ───

let serverCwd = '';

async function fetchServerCwd() {
    if (serverCwd) return serverCwd;
    try {
        const res = await fetch(`${API_BASE}/api/cwd`);
        if (res.ok) {
            const data = await res.json();
            serverCwd = data.cwd || '';
        }
    } catch { /* best effort */ }
    return serverCwd;
}

async function openFolderBrowser() {
    if (window.showDirectoryPicker) {
        try {
            const dirHandle = await window.showDirectoryPicker({ mode: 'read' });
            const folderName = dirHandle.name || 'selected-folder';
            const cwd = await fetchServerCwd();
            const parentDir = cwd ? cwd.replace(/\/[^/]+$/, '') : '';
            const fullPath = parentDir ? `${parentDir}/${folderName}` : folderName;
            applyPickedFolder(fullPath);
            return;
        } catch (err) {
            if (err && err.name === 'AbortError') return;
        }
    }

    document.getElementById('folderPicker').click();
}

function applyPickedFolder(fullPath) {
    const pathInput = document.getElementById('outputDir');
    pathInput.value = fullPath;
    pathInput.placeholder = fullPath;
    pathInput.title = `Output folder: ${fullPath}\nVerify this path is correct — browser cannot detect absolute paths.`;
    toggleClearBtn();

    const bar = pathInput.closest('.folder-bar');
    bar.style.borderColor = 'var(--green)';
    bar.style.boxShadow = '0 0 10px rgba(67,233,123,.35)';
    setTimeout(() => { bar.style.borderColor = ''; bar.style.boxShadow = ''; }, 1400);
}

async function onFolderPicked(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const firstPath = files[0].webkitRelativePath || '';
    const folderName = firstPath.split('/')[0] || files[0].name;
    const cwd = await fetchServerCwd();
    const parentDir = cwd ? cwd.replace(/\/[^/]+$/, '') : '';
    const fullPath = parentDir ? `${parentDir}/${folderName}` : folderName;

    applyPickedFolder(fullPath);
}

function onPathTyped() { toggleClearBtn(); }

function clearFolder() {
    const p = document.getElementById('outputDir');
    p.value = '';
    p.placeholder = 'Select a folder or type a path\u2026';
    p.title = '';
    document.getElementById('folderPicker').value = '';
    toggleClearBtn();
}

function toggleClearBtn() {
    const has = document.getElementById('outputDir').value.trim().length > 0;
    document.getElementById('clearBtn').classList.toggle('visible', has);
}

// ─── Boot ───

initAgents();
loadSettings();
initDashData();
buildAgentCards();
onAuthModeChanged();
initPasteHandler();
refreshBackendStatus();
setInterval(refreshBackendStatus, 12000);
connectSocket();
renderDashboard();
startDashTimer();
requestAnimationFrame(loop);
applyRoute();
