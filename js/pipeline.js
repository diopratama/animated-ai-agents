// ═══════════════════════════════════════════════════════
//  PIPELINE ORCHESTRATION
// ═══════════════════════════════════════════════════════

function buildAgentCards() {
    const list = document.getElementById('agentList');
    list.innerHTML = '';
    AGENTS.forEach((a, i) => {
        list.innerHTML += `
      <div class="agent-card" id="card-${a.id}">
        <div class="agent-avatar">${a.emoji}</div>
        <div class="agent-info">
          <div class="agent-name">${a.charName.toUpperCase()} <span style="font-family:Inter;font-size:8px;color:var(--muted);text-transform:none;">— ${a.name}</span></div>
          <div class="agent-status" id="status-${a.id}">Idle</div>
          <div class="agent-controls">
            <button class="agent-btn" id="toggle-${a.id}" onclick="toggleAgent('${a.id}')">START</button>
          </div>
        </div>
        <div class="agent-badge" id="badge-${a.id}"></div>
      </div>`;
    });
}

function setAgentUI(agent, state) {
    const card = document.getElementById(`card-${agent.id}`);
    const status = document.getElementById(`status-${agent.id}`);
    const badge = document.getElementById(`badge-${agent.id}`);

    card.className = `agent-card ${state}`;
    badge.className = `agent-badge ${state}`;
    status.className = `agent-status ${state}`;
    status.textContent = agent.statusText;
}

function log(tag, tagClass, message) {
    const area = document.getElementById('logArea');
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.innerHTML = `<span class="tag ${tagClass}">[${tag}]</span>${message}`;
    area.appendChild(entry);
    area.scrollTop = area.scrollHeight;
}

async function delay(ms) {
    return new Promise(r => setTimeout(r, ms));
}

function setHeaderStatus(status, text) {
    const dot = document.getElementById('geminiStatusDot');
    const label = document.getElementById('geminiStatusText');
    dot.classList.remove('offline', 'warn');
    if (status === 'offline') dot.classList.add('offline');
    if (status === 'warn') dot.classList.add('warn');
    label.textContent = text;
}

function onAuthModeChanged() {
    const mode = document.getElementById('authMode').value;
    const keyInput = document.getElementById('authApiKey');
    const hint = document.getElementById('authHint');

    if (mode === 'google_login') {
        keyInput.style.display = 'none';
        hint.textContent = 'Google login mode uses Gemini CLI account credentials mounted into the container.';
    } else {
        keyInput.style.display = '';
        hint.textContent = 'Using API key from input or container environment.';
    }
}

function getAuthPayload(forceMode = null) {
    const mode = forceMode || document.getElementById('authMode').value;
    const apiKey = document.getElementById('authApiKey').value.trim();
    return {
        authMode: mode,
        apiKey: mode === 'api_key' ? apiKey : '',
    };
}

function updateToggleButton(agentId) {
    const btn = document.getElementById(`toggle-${agentId}`);
    if (!btn) return;
    const running = enabledAgents.has(agentId);
    btn.textContent = running ? 'STOP' : 'START';
    btn.classList.toggle('active', running);
}

async function toggleAgent(agentId) {
    const agent = agentById(agentId);
    if (!agent) return;

    const btn = document.getElementById(`toggle-${agentId}`);
    if (btn) btn.disabled = true;

    if (enabledAgents.has(agentId)) {
        try {
            await stopAgent(agentId);
            enabledAgents.delete(agentId);
            agent.state = 'idle';
            agent.statusText = 'Idle';
            agent.bubble = '';
            agent.isActive = false;
            setAgentUI(agent, '');
            updateDashAgentStatus(agentId, 'stopped');
            log('SYSTEM', 'tag-sys', `⏹ ${agent.name} stopped.`);
        } catch (err) {
            log('SYSTEM', 'tag-sys', `⚠️ Could not stop ${agent.name}: ${err.message || 'unknown'}`);
        }
    } else {
        try {
            await startAgent(agentId);
            enabledAgents.add(agentId);
            log('SYSTEM', 'tag-sys', `▶️ ${agent.name} started.`);
        } catch (err) {
            log('SYSTEM', 'tag-sys', `❌ Failed to start ${agent.name}: ${err.message}`);
        }
    }

    if (btn) btn.disabled = false;
    updateToggleButton(agentId);
}

async function recoverRunningState() {
    try {
        const res = await fetch(`${API_BASE}/api/agents`);
        if (!res.ok) return;
        const data = await res.json();
        const agents = data.agents || [];
        const runningIds = [];

        for (const snap of agents) {
            if (!snap.running) continue;
            const agent = agentById(snap.id);
            if (!agent) continue;

            enabledAgents.add(snap.id);
            updateToggleButton(snap.id);
            runningIds.push(snap.id);

            if (snap.status === 'working') {
                agent.state = 'working';
                agent.statusText = 'Working';
                agent.bubble = 'Resumed — process still running';
                agent.isActive = true;
                setAgentUI(agent, 'active');
                updateDashAgentStatus(snap.id, 'working');
            } else if (snap.status === 'done') {
                agent.state = 'idle';
                agent.statusText = 'Done';
                agent.bubble = 'Finished';
                agent.isActive = false;
                setAgentUI(agent, 'active');
                updateDashAgentStatus(snap.id, 'done');
            } else {
                agent.state = 'idle';
                agent.statusText = 'Ready';
                agent.bubble = 'Ready for work';
                setAgentUI(agent, 'active');
            }
        }

        if (runningIds.length > 0) {
            pipelineRunning = true;
            pipelineAgentIds = runningIds;
            setPipelineUI(true);
            log('SYSTEM', 'tag-sys', `🔄 Recovered ${runningIds.length} running agent(s): ${runningIds.map(id => agentById(id)?.name || id).join(', ')}`);
            log('SYSTEM', 'tag-sys', 'ℹ️ Previous logs were lost on page refresh. New output will appear below.');
        }
    } catch {
        // recovery is best-effort
    }
}

function connectSocket() {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    socket = new WebSocket(`${proto}//${window.location.host}/ws`);

    socket.onopen = () => {
        log('SYSTEM', 'tag-sys', '🔌 Realtime channel connected.');
        recoverRunningState();
    };

    socket.onclose = () => {
        log('SYSTEM', 'tag-sys', '⚠️ Realtime channel disconnected, retrying...');
        setTimeout(connectSocket, 2500);
    };

    socket.onmessage = (event) => {
        let data = null;
        try {
            data = JSON.parse(event.data);
        } catch {
            return;
        }

        if (data.type === 'agent-log') {
            const agent = agentById(data.agentId);
            const tagMap = { arch: 'tag-arch', uxr: 'tag-uxr', uxa: 'tag-uxa', uid: 'tag-uid', ipe: 'tag-ipe', db: 'tag-db', be: 'tag-be', fe: 'tag-fe', qa: 'tag-qa', devops: 'tag-devops', sec: 'tag-sec' };
            const tagClass = tagMap[data.agentId] || 'tag-sys';
            const message = (data.message || '').trim();
            if (!message) return;

            log(agent?.name || 'SYSTEM', tagClass, message);
            parseDashboardMessage(data.agentId, message);

            if (agent && data.stream === 'stdout') {
                const preview = message.length > 40 ? message.substring(0, 40) + '…' : message;
                agent.bubble = preview;
                agent.state = 'working';
                agent.statusText = 'Working';
                agent.isActive = true;
                activeAgentIdx = AGENTS.findIndex((a) => a.id === data.agentId);
                setAgentUI(agent, 'active');
                if (Math.random() < 0.3) spawnParticles(agent, 5);
            }
            return;
        }

        if (data.type === 'agent-status') {
            const agent = agentById(data.agentId);
            if (!agent) return;
            updateDashAgentStatus(data.agentId, data.status);

            if (data.status === 'running') {
                enabledAgents.add(data.agentId);
                updateToggleButton(data.agentId);
                agent.state = 'idle';
                agent.statusText = 'Ready';
                agent.bubble = 'Ready for work';
                setAgentUI(agent, 'active');
                return;
            }

            if (data.status === 'working') {
                activeAgentIdx = AGENTS.findIndex((a) => a.id === data.agentId);
                agent.state = 'working';
                agent.statusText = 'Working';
                agent.bubble = 'Gemini CLI processing...';
                agent.isActive = true;
                setAgentUI(agent, 'active');
                spawnParticles(agent, 15);
                return;
            }

            if (data.status === 'done') {
                agent.state = 'idle';
                agent.statusText = 'Done';
                agent.bubble = 'Finished!';
                agent.isActive = false;
                setAgentUI(agent, 'active');
                spawnParticles(agent, 20);
                return;
            }

            if (data.status === 'stopped') {
                enabledAgents.delete(data.agentId);
                updateToggleButton(data.agentId);
                agent.state = 'idle';
                agent.statusText = 'Stopped';
                agent.bubble = '';
                agent.isActive = false;
                setAgentUI(agent, '');
                return;
            }

            if (data.status === 'error') {
                enabledAgents.delete(data.agentId);
                updateToggleButton(data.agentId);
                agent.state = 'idle';
                agent.statusText = 'Error';
                agent.bubble = '';
                agent.isActive = false;
                setAgentUI(agent, '');
            }

            checkPipelineAutoComplete();
        }
    };
}

function checkPipelineAutoComplete() {
    if (!pipelineRunning || pipelineAgentIds.length === 0) return;
    if (pipelineAwaitingDesign) return;
    const tracked = AGENTS.filter(a => pipelineAgentIds.includes(a.id));
    const allFinished = tracked.every(a =>
        a.statusText === 'Done' || a.statusText === 'Error' || a.statusText === 'Stopped'
    );
    if (allFinished) {
        pipelineRunning = false;
        setPipelineUI(false);
        log('SYSTEM', 'tag-sys', '✅ All pipeline agents have finished.');
        const outputDir = document.getElementById('outputDir').value.trim();
        if (outputDir) fetchAndShowSummary(outputDir);
        shutdownPipelineAgents();
    }
}

async function shutdownPipelineAgents() {
    const idsToStop = [...pipelineAgentIds];
    log('SYSTEM', 'tag-sys', '⏹ Auto-stopping all pipeline agents...');
    for (const agentId of idsToStop) {
        if (!enabledAgents.has(agentId)) continue;
        const agent = agentById(agentId);
        try {
            await stopAgent(agentId);
        } catch { /* best effort */ }
        enabledAgents.delete(agentId);
        if (agent) {
            agent.state = 'idle';
            agent.statusText = 'Idle';
            agent.bubble = '';
            agent.isActive = false;
            setAgentUI(agent, '');
        }
        updateToggleButton(agentId);
    }
    log('SYSTEM', 'tag-sys', '⏹ All agents stopped. Pipeline complete.');
}

async function fetchAndShowSummary(outputDir) {
    try {
        const res = await fetch(`${API_BASE}/api/summary?dir=${encodeURIComponent(outputDir)}`);
        if (!res.ok) return;
        const data = await res.json();

        log('SYSTEM', 'tag-sys', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        log('SYSTEM', 'tag-sys', '📋 PROJECT SUMMARY');
        log('SYSTEM', 'tag-sys', `📁 Output: ${data.dir}`);

        if (data.files && data.files.length > 0) {
            const dirs = data.files.filter(f => f.isDir).map(f => `📂 ${f.name}`);
            const files = data.files.filter(f => !f.isDir).map(f => `📄 ${f.name}`);
            log('SYSTEM', 'tag-sys', `📦 Generated ${data.files.length} item(s):`);
            for (const d of dirs) log('SYSTEM', 'tag-sys', `  ${d}`);
            for (const f of files) log('SYSTEM', 'tag-sys', `  ${f}`);
        }

        if (data.run && data.run.length > 0) {
            log('SYSTEM', 'tag-sys', '');
            log('SYSTEM', 'tag-sys', '🚀 HOW TO RUN:');
            for (const hint of data.run) {
                if (hint.type === 'npm') {
                    log('SYSTEM', 'tag-sys', `  npm scripts: ${hint.scripts.join(', ')}`);
                    if (hint.scripts.includes('dev')) {
                        log('SYSTEM', 'tag-sys', `  ▶ cd ${data.dir} && npm install && npm run dev`);
                    } else if (hint.scripts.includes('start')) {
                        log('SYSTEM', 'tag-sys', `  ▶ cd ${data.dir} && npm install && npm start`);
                    }
                }
                if (hint.type === 'make') {
                    log('SYSTEM', 'tag-sys', `  Makefile targets: ${hint.targets.join(', ')}`);
                    if (hint.targets.includes('run')) {
                        log('SYSTEM', 'tag-sys', `  ▶ cd ${data.dir} && make run`);
                    } else if (hint.targets.includes('build')) {
                        log('SYSTEM', 'tag-sys', `  ▶ cd ${data.dir} && make build`);
                    }
                }
                if (hint.type === 'docker-compose') {
                    log('SYSTEM', 'tag-sys', `  Docker Compose: ${hint.file}`);
                    log('SYSTEM', 'tag-sys', `  ▶ cd ${data.dir} && docker compose up -d`);
                }
                if (hint.type === 'dockerfile') {
                    log('SYSTEM', 'tag-sys', '  Dockerfile detected');
                    log('SYSTEM', 'tag-sys', `  ▶ cd ${data.dir} && docker build -t myapp . && docker run -p 8080:8080 myapp`);
                }
            }
        }

        if (data.readme) {
            log('SYSTEM', 'tag-sys', '');
            log('SYSTEM', 'tag-sys', '📖 README:');
            const lines = data.readme.split('\n');
            for (const line of lines) {
                log('SYSTEM', 'tag-sys', `  ${escHtml(line)}`);
            }
        }

        if (!data.readme && (!data.run || data.run.length === 0)) {
            log('SYSTEM', 'tag-sys', 'ℹ️ No README or runnable config found in output directory.');
        }

        log('SYSTEM', 'tag-sys', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    } catch {
        // summary is best-effort
    }
}

async function refreshBackendStatus() {
    try {
        const res = await fetch(`${API_BASE}/api/health`);
        if (!res.ok) throw new Error('Health endpoint failed');
        const data = await res.json();

        const authModeSelect = document.getElementById('authMode');
        const authHint = document.getElementById('authHint');

        if (data.auth) {
            latestAuthHealth = data.auth;

            if (!authModeInitialized) {
                authModeSelect.value = data.auth.defaultMode || 'api_key';
                authModeInitialized = true;
                onAuthModeChanged();
            }

            const googleOption = authModeSelect.querySelector('option[value="google_login"]');
            if (googleOption) {
                googleOption.disabled = !data.auth.availableModes?.google_login;
            }

            if (authModeSelect.value === 'google_login' && !data.auth.availableModes?.google_login) {
                authModeSelect.value = 'api_key';
                onAuthModeChanged();
                authHint.textContent = 'Google login credentials not detected in container. Use API key mode or mount credentials.';
            }
        }

        if (!data.ok) {
            const hasAuth = data.auth?.availableModes?.google_login || data.auth?.apiKeyConfigured;
            setHeaderStatus(hasAuth ? 'warn' : 'offline',
                hasAuth ? 'Bridge Ready (Gemini CLI will start on demand)' : 'Gemini Not Connected');
            return;
        }

        const version = data.gemini?.version ? ` (${data.gemini.version})` : '';
        setHeaderStatus('online', `Gemini Connected${version}`);
    } catch {
        setHeaderStatus('offline', 'Bridge Offline');
    }
}

async function startAgent(agentId, options = {}) {
    const { forceAuthMode = null } = options;
    const auth = getAuthPayload(forceAuthMode);

    const res = await fetch(`${API_BASE}/api/agents/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, authMode: auth.authMode, apiKey: auth.apiKey }),
    });

    if (!res.ok) {
        let err = 'Failed to start agent';
        try {
            const body = await res.json();
            err = body.error || err;
        } catch {
            // no-op
        }

        const mode = auth.authMode;
        const canFallbackToGoogle =
            mode === 'api_key' &&
            /API key mode selected but no key provided/i.test(err) &&
            latestAuthHealth?.availableModes?.google_login;

        if (canFallbackToGoogle) {
            document.getElementById('authMode').value = 'google_login';
            onAuthModeChanged();
            log('SYSTEM', 'tag-sys', 'ℹ️ No API key found, auto-switching to Google Login.');
            return startAgent(agentId, { forceAuthMode: 'google_login' });
        }

        throw new Error(err);
    }
}

async function runAgentPrompt(agentId, prompt, outputDir) {
    const payload = { prompt, outputDir };
    if (selectedModel) payload.model = selectedModel;
    const res = await fetch(`${API_BASE}/api/agents/${agentId}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        let err = 'Failed to run agent';
        try {
            const body = await res.json();
            err = body.error || err;
        } catch {
            // no-op
        }
        throw new Error(err);
    }
}

async function stopAgent(agentId) {
    const res = await fetch(`${API_BASE}/api/agents/${agentId}/stop`, { method: 'POST' });
    if (!res.ok && res.status !== 404) {
        let err = 'Failed to stop agent';
        try {
            const body = await res.json();
            err = body.error || err;
        } catch {
            // no-op
        }
        throw new Error(err);
    }
}

function waitForAgent(agentId) {
    return new Promise((resolve) => {
        const output = [];
        const handler = (event) => {
            let data;
            try { data = JSON.parse(event.data); } catch { return; }
            if (data.agentId !== agentId) return;
            if (data.type === 'agent-log') output.push(data.message || '');
            if (data.type === 'agent-status' &&
                (data.status === 'done' || data.status === 'error' || data.status === 'stopped')) {
                socket.removeEventListener('message', handler);
                resolve({ status: data.status, output: output.join('\n') });
            }
        };
        socket.addEventListener('message', handler);
    });
}

function parseRequiredAgents(archOutput) {
    const AGENT_IDS = ['uxr', 'uxa', 'uid', 'ipe', 'db', 'be', 'fe', 'qa', 'devops', 'sec'];

    const tagMatch = archOutput.match(/REQUIRED_AGENTS:\s*(.+)/i);
    if (tagMatch) {
        const ids = tagMatch[1].split(/[,\s]+/).map(s => s.trim().toLowerCase()).filter(Boolean);
        const valid = ids.filter(id => AGENT_IDS.includes(id));
        if (valid.length > 0) return valid;
    }

    const text = archOutput.toLowerCase();
    const agentKeywords = {
        uxr:    ['ux researcher', 'user researcher', 'user research'],
        uxa:    ['ux architect', 'ux architecture'],
        uid:    ['ui designer', 'visual designer', 'interface designer'],
        ipe:    ['image prompt', 'prompt engineer', 'asset generation'],
        db:     ['db designer', 'database designer'],
        be:     ['backend dev', 'backend developer'],
        fe:     ['frontend dev', 'frontend developer'],
        qa:     ['qa engineer', 'qa agent'],
        devops: ['devops engineer'],
        sec:    ['security engineer'],
    };
    const needed = [];
    for (const [id, keywords] of Object.entries(agentKeywords)) {
        if (keywords.some(kw => text.includes(kw))) needed.push(id);
    }
    return needed.length > 0 ? needed : AGENT_IDS;
}

async function enableAgent(agentId) {
    if (enabledAgents.has(agentId)) return;
    await startAgent(agentId);
    enabledAgents.add(agentId);
    updateToggleButton(agentId);
}

async function dispatchAgent(agent, story, outputDir) {
    const prompt = buildClientPrompt(agent, story, outputDir);
    await runAgentPrompt(agent.id, prompt, outputDir);
    activeAgentIdx = AGENTS.findIndex((a) => a.id === agent.id);
    agent.state = 'working';
    agent.bubble = 'Working...';
    agent.statusText = 'Working';
    agent.isActive = true;
    setAgentUI(agent, 'active');
    spawnParticles(agent, 15);
    log(agent.name, 'tag-sys', '🚀 Gemini CLI processing...');
}

// ── Pipeline Mode (Build / Fix) ──

const FIX_KEYWORDS = {
    uxr:    ['user research', 'persona', 'journey map', 'usability', 'user testing', 'heuristic', 'user interview', 'survey'],
    uxa:    ['information architecture', 'wireframe', 'design system', 'design token', 'breakpoint', 'responsive design', 'navigation pattern'],
    uid:    ['visual design', 'color palette', 'typography', 'icon', 'illustration', 'component design', 'dark mode', 'theme', 'spacing', 'shadow'],
    ipe:    ['image prompt', 'ai image', 'midjourney', 'dall-e', 'stable diffusion', 'asset generation', 'photography prompt', 'visual asset'],
    fe:     ['css', 'html', 'ui', 'button', 'layout', 'style', 'page', 'form', 'render', 'display', 'click', 'modal', 'responsive', 'frontend', 'component', 'react', 'vue', 'angular', 'tailwind', 'margin', 'padding', 'flex', 'grid'],
    be:     ['api', 'endpoint', 'server', 'route', 'middleware', 'express', '500', '502', '503', 'cors', 'request', 'response', 'auth', 'backend', 'controller', 'service', 'node', 'fastify'],
    db:     ['sql', 'migration', 'schema', 'table', 'column', 'query', 'foreign key', 'index', 'database', 'postgres', 'mysql', 'mongo', 'prisma', 'sequelize', 'typeorm'],
    devops: ['docker', 'container', 'deploy', 'compose', 'port', 'nginx', 'ci', 'cd', 'pipeline', 'build', 'dockerfile', 'k8s', 'kubernetes', 'helm', 'github action', 'yaml'],
    qa:     ['test', 'assert', 'spec', 'coverage', 'e2e', 'unit test', 'integration', 'jest', 'mocha', 'cypress', 'playwright', 'vitest'],
    sec:    ['xss', 'csrf', 'injection', 'vulnerability', 'security', 'ssl', 'certificate', 'token', 'jwt', 'owasp', 'permission', 'privilege', 'exploit'],
};

function detectFixAgent(text) {
    const lower = text.toLowerCase();
    let best = null;
    let bestScore = 0;
    let bestMatches = [];
    for (const [agentId, keywords] of Object.entries(FIX_KEYWORDS)) {
        const matched = keywords.filter(kw => lower.includes(kw));
        if (matched.length > bestScore) {
            bestScore = matched.length;
            best = agentId;
            bestMatches = matched;
        }
    }
    return { agentId: best, score: bestScore, matches: bestMatches };
}

function populateFixAgentDropdown() {
    const sel = document.getElementById('fixAgent');
    sel.innerHTML = '';
    const autoOpt = document.createElement('option');
    autoOpt.value = 'auto';
    autoOpt.textContent = '🤖 Smart Detect Agent';
    sel.appendChild(autoOpt);
    for (const a of AGENTS) {
        if (a.id === 'arch') continue;
        const opt = document.createElement('option');
        opt.value = a.id;
        opt.textContent = `${a.emoji} ${a.charName} — ${a.name}`;
        sel.appendChild(opt);
    }
    sel.value = 'auto';
}

let _inputDebounce = null;

function onStoryInputChanged() {
    const mode = document.getElementById('pipelineMode').value;
    if (mode !== 'fix') return;
    const sel = document.getElementById('fixAgent');
    if (sel.value !== 'auto') return;
    clearTimeout(_inputDebounce);
    _inputDebounce = setTimeout(() => {
        const text = document.getElementById('storyInput').value.trim();
        if (!text) return;
        detectFixAgent(text);
        updateFixAutoTag();
    }, 300);
}

function onFixAgentManualChange() {
    updateFixAutoTag();
}

function updateFixAutoTag() {
    const tag = document.getElementById('fixAutoTag');
    if (!tag) return;
    const sel = document.getElementById('fixAgent');
    if (sel.value === 'auto') {
        const text = document.getElementById('storyInput').value.trim();
        if (!text) {
            tag.textContent = '⏳ type to detect';
            tag.className = 'fix-auto-tag waiting';
            tag.title = 'Start typing the bug description and the system will analyze keywords to pick the best agent.';
        } else {
            const result = detectFixAgent(text);
            if (result.score === 0) {
                tag.textContent = '⏳ no match yet';
                tag.className = 'fix-auto-tag waiting';
                tag.title = 'No keywords matched. Add more detail about the bug (e.g. "CSS layout", "API 500", "Docker build").';
            } else {
                const agent = agentById(result.agentId);
                tag.textContent = `🎯 ${agent ? agent.charName : result.agentId}`;
                tag.className = 'fix-auto-tag';
                tag.title = `Detected keywords: ${result.matches.join(', ')}`;
            }
        }
    } else {
        tag.textContent = '✏️ manual';
        tag.className = 'fix-auto-tag manual';
        tag.title = 'You manually selected this agent.';
    }
}

function onPipelineModeChanged() {
    const mode = document.getElementById('pipelineMode').value;
    const label = document.getElementById('inputLabel');
    const input = document.getElementById('storyInput');
    const fixWrap = document.getElementById('fixAgentWrap');
    const pasteZone = document.getElementById('pasteZone');
    const runBtn = document.getElementById('runBtn');

    if (mode === 'fix') {
        label.textContent = 'BUG / ERROR';
        input.value = '';
        input.placeholder = 'Describe the bug or paste error message / screenshot here...';
        input.rows = 3;
        fixWrap.style.display = '';
        pasteZone.style.display = '';
        runBtn.textContent = '🔧 FIX';
        populateFixAgentDropdown();
        updateFixAutoTag();
    } else {
        label.textContent = 'USER STORY';
        input.value = '';
        input.placeholder = 'As a user I want to...';
        input.rows = 2;
        fixWrap.style.display = 'none';
        pasteZone.style.display = 'none';
        runBtn.textContent = '▶ RUN ALL';
        _pastedImages = [];
        document.getElementById('pastePreviews').innerHTML = '';
    }
}

function buildFixPrompt(agent, bugDescription, outputDir, images) {
    const roleMap = {
        uxr:    'UX Researcher — fix user research artifacts, personas, journey maps, and usability findings.',
        uxa:    'UX Architect — fix information architecture, wireframes, design system tokens, and UX specifications.',
        uid:    'UI Designer — fix visual design specs, component designs, color/typography issues, and accessibility compliance.',
        ipe:    'Image Prompt Engineer — fix AI image prompts, asset specifications, and visual asset documentation.',
        db:     'DB Designer — fix database schema, migrations, queries, and data issues.',
        be:     'Backend Dev — fix API endpoints, services, middleware, and server-side logic.',
        fe:     'Frontend Dev — fix UI components, styles, layout, forms, and client-side logic.',
        qa:     'QA Engineer — fix failing tests, update test cases, and resolve test infrastructure issues.',
        devops: 'DevOps Engineer — fix Docker, CI/CD, deployment, and infrastructure issues.',
        sec:    'Security Engineer — fix security vulnerabilities, auth issues, and hardening problems.',
    };
    const dir = outputDir || '.';
    const lines = [
        `You are: ${agent.name} (${roleMap[agent.id] || agent.name})`,
        ``,
        `The user has reported a bug or error in the existing project at "./${dir}/".`,
        ``,
        `Bug/error description:`,
        bugDescription,
    ];

    if (images && images.length > 0) {
        lines.push(``, `The user also attached ${images.length} screenshot(s) showing the issue.`);
        lines.push(`Screenshot data is embedded below as base64 — analyze them to understand the visual bug.`);
        for (const img of images) {
            lines.push(``, `[Screenshot: ${img.name}]`, img.dataUrl);
        }
    }

    lines.push(
        ``,
        `IMPORTANT:`,
        `1. First, READ the existing code in "./${dir}/" to understand the current implementation.`,
        `2. Identify the root cause of the bug.`,
        `3. Fix ONLY the affected code. Do not rewrite unrelated files.`,
        `4. If the fix requires a new file, create it under "./${dir}/".`,
        `5. Explain what you changed and why.`,
    );
    return lines.join('\n');
}

let _pastedImages = [];

function initPasteHandler() {
    document.getElementById('storyInput').addEventListener('paste', (e) => {
        const mode = document.getElementById('pipelineMode').value;
        if (mode !== 'fix') return;
        const items = e.clipboardData?.items;
        if (!items) return;
        for (const item of items) {
            if (!item.type.startsWith('image/')) continue;
            e.preventDefault();
            const file = item.getAsFile();
            if (!file) continue;
            const reader = new FileReader();
            reader.onload = () => {
                _pastedImages.push({ name: file.name || `screenshot_${Date.now()}.png`, dataUrl: reader.result });
                renderPastePreviews();
            };
            reader.readAsDataURL(file);
        }
    });
}

function renderPastePreviews() {
    const container = document.getElementById('pastePreviews');
    container.innerHTML = '';
    _pastedImages.forEach((img, idx) => {
        const thumb = document.createElement('div');
        thumb.className = 'paste-thumb';
        thumb.innerHTML = `<img src="${img.dataUrl}" alt="screenshot" /><button class="paste-thumb-remove" onclick="removePastedImage(${idx})">×</button>`;
        container.appendChild(thumb);
    });
    const zone = document.getElementById('pasteZone');
    zone.style.display = _pastedImages.length > 0 || document.getElementById('pipelineMode').value === 'fix' ? '' : 'none';
}

function removePastedImage(idx) {
    _pastedImages.splice(idx, 1);
    renderPastePreviews();
}

async function startQuickFix() {
    if (pipelineRunning) return;
    pipelineRunning = true;
    setPipelineUI(true);
    resetDashboard();

    const logArea = document.getElementById('logArea');
    logArea.innerHTML = '';

    const outputEl = document.getElementById('outputDir');
    const outputDir = outputEl.value.trim() || '(from project.config.md)';
    const bugText = document.getElementById('storyInput').value.trim();
    let agentId = document.getElementById('fixAgent').value;

    if (agentId === 'auto') {
        const result = detectFixAgent(bugText);
        agentId = result.agentId || 'be';
        const matchInfo = result.score > 0
            ? `matched: ${result.matches.join(', ')}`
            : 'no keywords matched, defaulting to Backend Dev';
        log('SYSTEM', 'tag-sys', `🤖 Smart Detect → ${agentById(agentId)?.name || agentId} (${matchInfo})`);
    }

    const agent = agentById(agentId);

    if (!bugText && _pastedImages.length === 0) {
        log('SYSTEM', 'tag-sys', '⚠️ Please describe the bug or paste an error screenshot.');
        pipelineRunning = false;
        setPipelineUI(false);
        return;
    }

    if (!agent) {
        log('SYSTEM', 'tag-sys', '⚠️ No agent selected.');
        pipelineRunning = false;
        setPipelineUI(false);
        return;
    }

    pipelineAgentIds = [agentId];

    const description = bugText || '(see attached screenshot)';
    log('SYSTEM', 'tag-sys', `🔧 Quick Fix: "${description}"`);
    log('SYSTEM', 'tag-sys', `📁 Target dir: ${outputDir}`);
    log('SYSTEM', 'tag-sys', `🎯 Assigned to: ${agent.emoji} ${agent.charName} (${agent.name})`);
    if (_pastedImages.length > 0) {
        log('SYSTEM', 'tag-sys', `📎 ${_pastedImages.length} screenshot(s) attached`);
    }

    try {
        await enableAgent(agentId);
    } catch (err) {
        log('SYSTEM', 'tag-sys', `❌ Could not enable ${agent.name}: ${err.message}`);
        pipelineRunning = false;
        setPipelineUI(false);
        return;
    }

    const prompt = buildFixPrompt(agent, description, outputDir, _pastedImages);
    try {
        await runAgentPrompt(agentId, prompt, outputDir);
        agent.state = 'working';
        agent.bubble = 'Fixing...';
        agent.statusText = 'Working';
        agent.isActive = true;
        activeAgentIdx = AGENTS.findIndex(a => a.id === agentId);
        setAgentUI(agent, 'active');
        spawnParticles(agent, 15);
        log(agent.name, 'tag-sys', '🔧 Analyzing and fixing...');
    } catch (err) {
        log('SYSTEM', 'tag-sys', `❌ ${agent.name}: ${err.message}`);
        pipelineRunning = false;
        setPipelineUI(false);
    }
}

function setPipelineUI(running) {
    const mode = document.getElementById('pipelineMode').value;
    const runBtn = document.getElementById('runBtn');
    const stopBtn = document.getElementById('stopPipelineBtn');
    if (running) {
        runBtn.style.display = 'none';
        stopBtn.style.display = '';
    } else {
        runBtn.style.display = '';
        runBtn.disabled = false;
        runBtn.textContent = mode === 'fix' ? '🔧 FIX' : '▶ RUN ALL';
        stopBtn.style.display = 'none';
    }
}

async function stopPipeline() {
    if (!pipelineRunning) return;
    log('SYSTEM', 'tag-sys', '⏹ Stopping pipeline...');
    pipelineRunning = false;
    pipelineAwaitingDesign = false;

    for (const agent of AGENTS) {
        if (!enabledAgents.has(agent.id)) continue;
        try {
            await stopAgent(agent.id);
            enabledAgents.delete(agent.id);
            agent.state = 'idle';
            agent.statusText = 'Idle';
            agent.bubble = '';
            agent.isActive = false;
            setAgentUI(agent, '');
            updateToggleButton(agent.id);
            updateDashAgentStatus(agent.id, 'stopped');
        } catch { /* best effort */ }
    }

    log('SYSTEM', 'tag-sys', '⏹ Pipeline stopped.');
    setPipelineUI(false);
}

async function startPipeline() {
    const mode = document.getElementById('pipelineMode').value;
    if (mode === 'fix') return startQuickFix();

    if (pipelineRunning) return;
    pipelineRunning = true;
    setPipelineUI(true);

    resetDashboard();

    const logArea = document.getElementById('logArea');
    logArea.innerHTML = '';

    const outputEl = document.getElementById('outputDir');
    const outputDir = outputEl.value.trim() || '(from project.config.md)';
    const story = document.getElementById('storyInput').value.trim() || 'As a user I want to';

    log('SYSTEM', 'tag-sys', `🚀 Pipeline: "${story}"`);
    log('SYSTEM', 'tag-sys', `📁 Output dir: ${outputDir}`);

    // ── Phase 1: Architect analyzes the task and picks agents ──
    const arch = agentById('arch');
    log('SYSTEM', 'tag-sys', '🏛️ Phase 1: Architect analyzing task...');

    try {
        await enableAgent('arch');
    } catch (err) {
        log('SYSTEM', 'tag-sys', `❌ Could not enable Architect: ${err.message}`);
        pipelineRunning = false;
        setPipelineUI(false);
        return;
    }

    const archPrompt = buildClientPrompt(arch, story, outputDir);
    try {
        const archWait = waitForAgent('arch');
        await runAgentPrompt('arch', archPrompt, outputDir);
        arch.state = 'working';
        arch.bubble = 'Planning...';
        arch.statusText = 'Planning';
        arch.isActive = true;
        activeAgentIdx = 0;
        setAgentUI(arch, 'active');
        spawnParticles(arch, 15);
        log('Architect', 'tag-arch', '🚀 Analyzing user story...');

        const archResult = await archWait;

        if (!pipelineRunning) return;

        if (archResult.status === 'error' || archResult.status === 'stopped') {
            log('SYSTEM', 'tag-sys', archResult.status === 'stopped'
                ? '⏹ Pipeline stopped by user.'
                : '❌ Architect failed. Aborting pipeline.');
            pipelineRunning = false;
            setPipelineUI(false);
            return;
        }

        // ── Phase 2: Parse output and separate design vs engineering agents ──
        const requiredIds = parseRequiredAgents(archResult.output);

        const hasDesign = requiredIds.some(id => DESIGN_AGENT_IDS.has(id));
        if (hasDesign && !requiredIds.includes('fe')) {
            requiredIds.push('fe');
        }

        const requiredAgents = AGENTS.filter(a => requiredIds.includes(a.id));
        const skippedAgents = AGENTS.filter(a => a.id !== 'arch' && !requiredIds.includes(a.id));

        const designAgents = requiredAgents.filter(a => DESIGN_AGENT_IDS.has(a.id));
        const engineeringAgents = requiredAgents.filter(a => !DESIGN_AGENT_IDS.has(a.id));

        pipelineAgentIds = ['arch', ...requiredIds];

        log('SYSTEM', 'tag-sys', `🎯 Architect selected ${requiredAgents.length} agent(s): ${requiredAgents.map(a => a.name).join(', ')}`);
        if (designAgents.length > 0) {
            log('SYSTEM', 'tag-sys', `🎨 Design team: ${designAgents.map(a => a.name).join(', ')}`);
        }
        if (engineeringAgents.length > 0) {
            log('SYSTEM', 'tag-sys', `⚙️ Engineering team: ${engineeringAgents.map(a => a.name).join(', ')}`);
        }
        if (skippedAgents.length > 0) {
            log('SYSTEM', 'tag-sys', `⏭️ Skipping: ${skippedAgents.map(a => a.name).join(', ')}`);
        }

        // ── Phase 2: Design phase — must complete before engineering ──
        if (designAgents.length > 0) {
            log('SYSTEM', 'tag-sys', '🎨 Phase 2: Design team working... (engineering will wait)');
            pipelineAwaitingDesign = true;
            const designPromises = [];

            for (const agent of designAgents) {
                if (!pipelineRunning) {
                    log('SYSTEM', 'tag-sys', '⏹ Pipeline stopped by user.');
                    break;
                }
                try {
                    await enableAgent(agent.id);
                } catch (err) {
                    log('SYSTEM', 'tag-sys', `❌ Could not enable ${agent.name}: ${err.message}`);
                    continue;
                }
                const waitPromise = waitForAgent(agent.id);
                try {
                    await dispatchAgent(agent, story, outputDir);
                    designPromises.push(waitPromise);
                } catch (err) {
                    log('SYSTEM', 'tag-sys', `❌ ${agent.name}: ${err.message}`);
                }
            }

            if (designPromises.length > 0 && pipelineRunning) {
                log('SYSTEM', 'tag-sys', `⏳ Waiting for ${designPromises.length} design agent(s) to finish...`);
                const designResults = await Promise.all(designPromises);

                pipelineAwaitingDesign = false;

                if (!pipelineRunning) return;

                const designDone = designResults.filter(r => r.status === 'done').length;
                const designFailed = designResults.filter(r => r.status !== 'done').length;

                if (designFailed > 0) {
                    log('SYSTEM', 'tag-sys', `⚠️ ${designFailed} design agent(s) did not complete successfully.`);
                }
                log('SYSTEM', 'tag-sys', `✅ Design phase complete (${designDone}/${designResults.length} succeeded). Handing off to engineering team.`);
            } else {
                pipelineAwaitingDesign = false;
            }
        }

        // ── Phase 3: Engineering phase — starts after design is done ──
        if (engineeringAgents.length > 0 && pipelineRunning) {
            log('SYSTEM', 'tag-sys', `⚙️ Phase ${designAgents.length > 0 ? '3' : '2'}: Engineering team starting...`);

            for (const agent of engineeringAgents) {
                if (!pipelineRunning) {
                    log('SYSTEM', 'tag-sys', '⏹ Pipeline stopped by user.');
                    break;
                }
                try {
                    await enableAgent(agent.id);
                } catch (err) {
                    log('SYSTEM', 'tag-sys', `❌ Could not enable ${agent.name}: ${err.message}`);
                    continue;
                }
                try {
                    await dispatchAgent(agent, story, outputDir);
                } catch (err) {
                    log('SYSTEM', 'tag-sys', `❌ ${agent.name}: ${err.message}`);
                }
            }
        }

        if (pipelineRunning) {
            log('SYSTEM', 'tag-sys', '✅ All selected agents dispatched. Responses will appear in the activity log.');
        }
    } catch (err) {
        log('SYSTEM', 'tag-sys', `❌ Pipeline error: ${err.message}`);
        pipelineRunning = false;
        setPipelineUI(false);
    }
}

async function startAllAgents() {
    const btn = document.getElementById('startAllBtn');
    btn.disabled = true;
    for (const agent of AGENTS) {
        if (enabledAgents.has(agent.id)) continue;
        try {
            await startAgent(agent.id);
            enabledAgents.add(agent.id);
            updateToggleButton(agent.id);
            log('SYSTEM', 'tag-sys', `▶️ ${agent.name} started.`);
        } catch (err) {
            log('SYSTEM', 'tag-sys', `❌ Failed to start ${agent.name}: ${err.message}`);
        }
    }
    btn.disabled = false;
}

async function stopAllAgents() {
    const btn = document.getElementById('stopAllBtn');
    btn.disabled = true;
    for (const agent of AGENTS) {
        if (!enabledAgents.has(agent.id)) continue;
        try {
            await stopAgent(agent.id);
            enabledAgents.delete(agent.id);
            agent.state = 'idle';
            agent.statusText = 'Idle';
            agent.bubble = '';
            agent.isActive = false;
            setAgentUI(agent, '');
            updateToggleButton(agent.id);
            updateDashAgentStatus(agent.id, 'stopped');
            log('SYSTEM', 'tag-sys', `⏹ ${agent.name} stopped.`);
        } catch (err) {
            log('SYSTEM', 'tag-sys', `⚠️ Could not stop ${agent.name}: ${err.message || 'unknown'}`);
        }
    }
    pipelineRunning = false;
    setPipelineUI(false);
    btn.disabled = false;
}

const DESIGN_AGENT_IDS = new Set(['uxr', 'uxa', 'uid', 'ipe']);

function buildClientPrompt(agent, story, outputDir) {
    const roleMap = {
        arch: 'Architect — design the system architecture, define components, APIs, and tech decisions. Create architecture documents, diagrams, and specs.',
        uxr: 'UX Researcher — conduct user research, create personas, map user journeys, define UX requirements and usability test scenarios. Create research documents.',
        uxa: 'UX Architect — define information architecture, create wireframes, build CSS design system foundation with tokens, establish component architecture and responsive strategy. Create design system files.',
        uid: 'UI Designer — create visual designs, component specifications with CSS, interaction details, accessibility checklist. Produce detailed design specs and CSS files.',
        ipe: 'Image Prompt Engineer — craft AI image generation prompts for all visual assets needed, create asset manifests, define style guides. Produce prompt documentation files.',
        db: 'DB Designer — design the database schema with tables, relations, and indexes. Create migration files and schema documentation.',
        be: 'Backend Dev — implement API endpoints, services, middleware, and auth. Write actual code files.',
        fe: 'Frontend Dev — build UI components, pages, forms, and API integration. Write actual code files. Use the design system and visual specs from the design team.',
        qa: 'QA Engineer — write unit tests, integration tests, and E2E test scenarios. Write actual test files.',
        devops: 'DevOps Engineer — build Docker images, create docker-compose files, CI/CD pipelines, and make the service run locally. Write actual Dockerfiles, compose files, and scripts.',
        sec: 'Security Engineer — audit all code and infrastructure for security vulnerabilities, perform penetration testing, check OWASP Top 10 compliance. Report critical findings back to the Architect for remediation.',
    };
    const dir = outputDir || '.';
    const lines = [
        `You are: ${agent.name} (${roleMap[agent.id] || agent.name})`,
        ``,
        `User story: ${story}`,
        ``,
        `IMPORTANT: Create all files under the directory "./${dir}/". Use mkdir and write_file tools to create actual files on disk. Do not just describe what you would do — actually create the files.`,
        ``,
        `Keep your implementation minimal and appropriate for the task scope. Do not over-engineer. Match the complexity of your output to what the user story actually requires — a simple landing page should use plain HTML/CSS/JS, not a full framework project with databases and auth.`,
        ``,
        `Start working now. Produce your deliverables as real files.`,
    ];

    if (agent.id === 'arch') {
        lines.push(
            ``,
            `CRITICAL: At the very end of your response, you MUST output exactly which team members are needed for this task using this format on its own line:`,
            `REQUIRED_AGENTS: uxr, uxa, uid, ipe, fe, devops`,
            `Valid agent IDs: uxr, uxa, uid, ipe, db, be, fe, qa, devops, sec`,
            `Design agents (uxr, uxa, uid, ipe) will complete ALL their work BEFORE engineering agents (db, be, fe, qa, devops, sec) start. Include design agents when the project needs UI/UX work.`,
            `Only include agents whose work is actually necessary for this user story. For example, a simple landing page needs "uxr, uxa, uid, fe" (and maybe "devops"). A full-stack app needs all agents.`,
        );
    }

    if (DESIGN_AGENT_IDS.has(agent.id)) {
        lines.push(
            ``,
            `You are part of the DESIGN PHASE. Your deliverables must be complete and thorough because the engineering team (Backend Dev, Frontend Dev, etc.) will not start until ALL design agents finish. The engineers will use your output as their foundation.`,
        );
    }

    if (!DESIGN_AGENT_IDS.has(agent.id) && agent.id !== 'arch') {
        lines.push(
            ``,
            `You are part of the ENGINEERING PHASE. The design team has already completed their work. Check the output directory for design deliverables (research findings, design system, UI specs, asset prompts) and use them as your foundation. Follow the design system tokens, component specs, and visual guidelines provided by the design team.`,
        );
    }

    return lines.join('\n');
}
