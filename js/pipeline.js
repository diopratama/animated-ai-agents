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

function connectSocket() {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    socket = new WebSocket(`${proto}//${window.location.host}/ws`);

    socket.onopen = () => {
        log('SYSTEM', 'tag-sys', '🔌 Realtime channel connected.');
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
            const tagMap = { arch: 'tag-arch', db: 'tag-db', be: 'tag-be', fe: 'tag-fe', qa: 'tag-qa', devops: 'tag-devops', sec: 'tag-sec' };
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
        }
    };
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
                (data.status === 'done' || data.status === 'error')) {
                socket.removeEventListener('message', handler);
                resolve({ status: data.status, output: output.join('\n') });
            }
        };
        socket.addEventListener('message', handler);
    });
}

function parseRequiredAgents(archOutput) {
    const AGENT_IDS = ['db', 'be', 'fe', 'qa', 'devops', 'sec'];

    const tagMatch = archOutput.match(/REQUIRED_AGENTS:\s*(.+)/i);
    if (tagMatch) {
        const ids = tagMatch[1].split(/[,\s]+/).map(s => s.trim().toLowerCase()).filter(Boolean);
        const valid = ids.filter(id => AGENT_IDS.includes(id));
        if (valid.length > 0) return valid;
    }

    const text = archOutput.toLowerCase();
    const agentKeywords = {
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

async function startPipeline() {
    if (pipelineRunning) return;
    const btn = document.getElementById('runBtn');
    btn.disabled = true;
    btn.textContent = '⏳ PLANNING';
    pipelineRunning = true;

    resetDashboard();

    const logArea = document.getElementById('logArea');
    logArea.innerHTML = '';

    const outputEl = document.getElementById('outputDir');
    const outputDir = outputEl.value.trim() || '(from project.config.md)';
    const story = document.getElementById('storyInput').value.trim() || 'As a user I want to login with Google';

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
        btn.disabled = false;
        btn.textContent = '▶ RUN ALL';
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

        btn.textContent = '⏳ ARCHITECT';
        const archResult = await archWait;

        if (archResult.status === 'error') {
            log('SYSTEM', 'tag-sys', '❌ Architect failed. Aborting pipeline.');
            pipelineRunning = false;
            btn.disabled = false;
            btn.textContent = '▶ RUN ALL';
            return;
        }

        // ── Phase 2: Parse output and dispatch selected agents ──
        const requiredIds = parseRequiredAgents(archResult.output);
        const requiredAgents = AGENTS.filter(a => requiredIds.includes(a.id));
        const skippedAgents = AGENTS.filter(a => a.id !== 'arch' && !requiredIds.includes(a.id));

        log('SYSTEM', 'tag-sys', `🎯 Architect selected ${requiredAgents.length} agent(s): ${requiredAgents.map(a => a.name).join(', ')}`);
        if (skippedAgents.length > 0) {
            log('SYSTEM', 'tag-sys', `⏭️ Skipping: ${skippedAgents.map(a => a.name).join(', ')}`);
        }

        btn.textContent = '⏳ RUNNING';
        log('SYSTEM', 'tag-sys', '📨 Dispatching to selected agents...');

        for (const agent of requiredAgents) {
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

        log('SYSTEM', 'tag-sys', '✅ All selected agents dispatched. Responses will appear in the activity log.');
    } catch (err) {
        log('SYSTEM', 'tag-sys', `❌ Pipeline error: ${err.message}`);
    }

    pipelineRunning = false;
    btn.disabled = false;
    btn.textContent = '▶ RUN ALL';
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
    const runBtn = document.getElementById('runBtn');
    if (runBtn) { runBtn.disabled = false; runBtn.textContent = '▶ RUN ALL'; }
    btn.disabled = false;
}

function buildClientPrompt(agent, story, outputDir) {
    const roleMap = {
        arch: 'Architect — design the system architecture, define components, APIs, and tech decisions. Create architecture documents, diagrams, and specs.',
        db: 'DB Designer — design the database schema with tables, relations, and indexes. Create migration files and schema documentation.',
        be: 'Backend Dev — implement API endpoints, services, middleware, and auth. Write actual code files.',
        fe: 'Frontend Dev — build UI components, pages, forms, and API integration. Write actual code files.',
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
            `REQUIRED_AGENTS: fe, devops`,
            `Valid agent IDs: db, be, fe, qa, devops, sec`,
            `Only include agents whose work is actually necessary for this user story. For example, a simple landing page only needs "fe" (and maybe "devops"). A full-stack app with a database needs "db, be, fe, qa, devops, sec".`,
        );
    }

    return lines.join('\n');
}
