// ═══════════════════════════════════════════════════════
//  SETTINGS
// ═══════════════════════════════════════════════════════

const SETTINGS_KEY = 'pixel-agents-settings';

const DEFAULT_NAMES = {
    arch: 'Asep', uxr: 'Dewi', uxa: 'Rizki', uid: 'Putri', ipe: 'Fajar',
    db: 'Jamal', be: 'Budi', fe: 'Slamet',
    qa: 'Mulyono', devops: 'Ade', sec: 'Trisno',
};

function applyPortalName() {
    const el = document.getElementById('portalNameDisplay');
    if (el) el.textContent = `⚡ ${portalName}`;
    document.title = `${portalName} — AI Dev Team`;
}

function loadSettings() {
    try {
        const raw = localStorage.getItem(SETTINGS_KEY);
        if (!raw) return;
        const s = JSON.parse(raw);
        if (s.names) {
            AGENTS.forEach(a => {
                if (s.names[a.id]) a.charName = s.names[a.id];
            });
        }
        if (s.model !== undefined) {
            const deprecated = new Set(['gemini-2.0-flash', 'gemini-2.0-flash-lite']);
            selectedModel = deprecated.has(s.model) ? '' : s.model;
            const sel = document.getElementById('modelSelect');
            if (sel) sel.value = selectedModel;
        }
        if (s.portalName) {
            portalName = s.portalName;
        }
        applyPortalName();
    } catch { /* corrupt storage */ }
}

function saveSettings() {
    const names = {};
    AGENTS.forEach(a => {
        const input = document.getElementById(`sname-${a.id}`);
        if (input) {
            const val = input.value.trim();
            a.charName = val || DEFAULT_NAMES[a.id];
            names[a.id] = a.charName;
        }
    });
    const modelSel = document.getElementById('modelSelect');
    selectedModel = modelSel ? modelSel.value : '';

    const portalInput = document.getElementById('portalNameInput');
    if (portalInput) {
        const val = portalInput.value.trim();
        portalName = val || DEFAULT_PORTAL_NAME;
    }
    applyPortalName();

    const settings = { names, model: selectedModel, portalName };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    buildAgentCards();
    renderDashboard();

    const badge = document.getElementById('settingsSaved');
    badge.classList.add('show');
    setTimeout(() => badge.classList.remove('show'), 2000);
}

function resetSettings() {
    AGENTS.forEach(a => { a.charName = DEFAULT_NAMES[a.id]; });
    selectedModel = '';
    portalName = DEFAULT_PORTAL_NAME;
    localStorage.removeItem(SETTINGS_KEY);
    buildSettingsForm();
    applyPortalName();
    const modelSel = document.getElementById('modelSelect');
    if (modelSel) modelSel.value = '';
    buildAgentCards();
    renderDashboard();

    const badge = document.getElementById('settingsSaved');
    badge.classList.add('show');
    setTimeout(() => badge.classList.remove('show'), 2000);
}

function buildSettingsForm() {
    const grid = document.getElementById('agentNameGrid');
    if (!grid) return;
    grid.innerHTML = AGENTS.map(a => `
        <div class="setting-field">
            <span class="sf-emoji">${a.emoji}</span>
            <span class="sf-label">${a.name}</span>
            <input type="text" id="sname-${a.id}" value="${a.charName}" placeholder="${DEFAULT_NAMES[a.id]}" spellcheck="false" />
        </div>
    `).join('');

    const portalInput = document.getElementById('portalNameInput');
    if (portalInput) portalInput.value = portalName;
}
