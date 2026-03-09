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

/**
 * Toggles between Dark and Light themes.
 * Syncs the two checkboxes (header and settings panel) and updates body class.
 */
function toggleTheme(event) {
    const headerToggle = document.getElementById('themeToggle');
    const settingsToggle = document.getElementById('themeCheckbox');
    const label = document.getElementById('themeLabel');
    
    // Determine the new state based on which element triggered the event
    // or fallback to header toggle if called programmatically
    let isLight = false;
    if (event && event.target) {
        isLight = event.target.checked;
    } else {
        isLight = headerToggle ? headerToggle.checked : false;
    }

    // Sync both toggles
    if (headerToggle) headerToggle.checked = isLight;
    if (settingsToggle) settingsToggle.checked = isLight;

    if (isLight) {
        document.body.classList.remove('theme-dark');
        document.body.classList.add('theme-light');
        if (label) label.textContent = 'LIGHT';
        theme = 'light';
    } else {
        document.body.classList.remove('theme-light');
        document.body.classList.add('theme-dark');
        if (label) label.textContent = 'DARK';
        theme = 'dark';
    }

    // Persist theme choice immediately
    try {
        const raw = localStorage.getItem(SETTINGS_KEY);
        const s = raw ? JSON.parse(raw) : {};
        s.theme = theme;
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
    } catch (e) {}
}

function loadSettings() {
    try {
        const raw = localStorage.getItem(SETTINGS_KEY);
        
        // Initial defaults
        if (!document.body.classList.contains('theme-light') && !document.body.classList.contains('theme-dark')) {
            document.body.classList.add('theme-dark');
        }

        if (!raw) {
            applyPortalName();
            return;
        }

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

        // Theme restoration
        const headerToggle = document.getElementById('themeToggle');
        const settingsToggle = document.getElementById('themeCheckbox');
        const label = document.getElementById('themeLabel');

        if (s.theme === 'light') {
            document.body.classList.remove('theme-dark');
            document.body.classList.add('theme-light');
            if (headerToggle) headerToggle.checked = true;
            if (settingsToggle) settingsToggle.checked = true;
            if (label) label.textContent = 'LIGHT';
            theme = 'light';
        } else {
            document.body.classList.remove('theme-light');
            document.body.classList.add('theme-dark');
            if (headerToggle) headerToggle.checked = false;
            if (settingsToggle) settingsToggle.checked = false;
            if (label) label.textContent = 'DARK';
            theme = 'dark';
        }

        applyPortalName();
    } catch (e) { 
        console.error("Error loading settings:", e);
    }
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

    const isLight = document.body.classList.contains('theme-light');
    const currentTheme = isLight ? 'light' : 'dark';

    applyPortalName();

    const settings = { names, model: selectedModel, portalName, theme: currentTheme };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    
    if (typeof buildAgentCards === 'function') buildAgentCards();
    if (typeof renderDashboard === 'function') renderDashboard();

    const badge = document.getElementById('settingsSaved');
    if (badge) {
        badge.classList.add('show');
        setTimeout(() => badge.classList.remove('show'), 2000);
    }
}

function resetSettings() {
    AGENTS.forEach(a => { a.charName = DEFAULT_NAMES[a.id]; });
    selectedModel = '';
    portalName = DEFAULT_PORTAL_NAME;
    
    document.body.classList.remove('theme-light');
    document.body.classList.add('theme-dark');
    
    const headerToggle = document.getElementById('themeToggle');
    const settingsToggle = document.getElementById('themeCheckbox');
    const label = document.getElementById('themeLabel');
    
    if (headerToggle) headerToggle.checked = false;
    if (settingsToggle) settingsToggle.checked = false;
    if (label) label.textContent = 'DARK';
    theme = 'dark';

    localStorage.removeItem(SETTINGS_KEY);
    buildSettingsForm();
    applyPortalName();
    
    const modelSel = document.getElementById('modelSelect');
    if (modelSel) modelSel.value = '';
    
    if (typeof buildAgentCards === 'function') buildAgentCards();
    if (typeof renderDashboard === 'function') renderDashboard();

    const badge = document.getElementById('settingsSaved');
    if (badge) {
        badge.classList.add('show');
        setTimeout(() => badge.classList.remove('show'), 2000);
    }
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
