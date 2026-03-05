// ═══════════════════════════════════════════════════════
//  MONITORING DASHBOARD
// ═══════════════════════════════════════════════════════

const dashData = {};
const secFindings = [];
const serviceURLs = new Map();
const deliverables = new Map();
let pipelineStartTime = 0;
let pipelineElapsed = 0;
let dashTimerHandle = null;
let dashRenderPending = false;

function initDashData() {
    AGENTS.forEach(a => {
        dashData[a.id] = {
            status: 'idle',
            startTime: 0,
            elapsed: 0,
            msgCount: 0,
            fileCount: 0,
            lastLine: '',
        };
    });
}

function resetDashboard() {
    Object.keys(dashData).forEach(id => {
        dashData[id] = { status: 'idle', startTime: 0, elapsed: 0, msgCount: 0, fileCount: 0, lastLine: '' };
    });
    secFindings.length = 0;
    serviceURLs.clear();
    deliverables.clear();
    pipelineStartTime = Date.now();
    pipelineElapsed = 0;
    document.getElementById('secSection').style.display = 'none';
    document.getElementById('svcSection').style.display = 'none';
    renderDashboard();
}

function fmtTime(ms) {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    if (h > 0) return `${h}h ${m % 60}m ${s % 60}s`;
    if (m > 0) return `${m}m ${s % 60}s`;
    return `${s}s`;
}

function parseDashboardMessage(agentId, message) {
    const d = dashData[agentId];
    if (!d) return;

    d.msgCount++;
    const trimmed = message.trim();
    if (trimmed) d.lastLine = trimmed;

    // --- Security findings ---
    const secRe = /\[SEC-(\d+)\]\s*(.+?)\s*[—\-]+\s*(CRITICAL|HIGH|MEDIUM|LOW|INFO(?:RMATIONAL)?)/gi;
    let m;
    while ((m = secRe.exec(message)) !== null) {
        const id = `SEC-${m[1]}`;
        if (!secFindings.find(f => f.id === id)) {
            secFindings.push({
                id,
                title: m[2].trim(),
                severity: m[3].toUpperCase().replace('INFORMATIONAL', 'INFO'),
            });
        }
    }

    const locRe = /\*\*Location\*\*:\s*`?([^`\n]+)`?/gi;
    while ((m = locRe.exec(message)) !== null) {
        const last = secFindings[secFindings.length - 1];
        if (last && !last.location) last.location = m[1].trim();
    }

    if (secFindings.length > 0) {
        document.getElementById('secSection').style.display = '';
    }

    // --- Service URLs ---
    const urlRe = /https?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0)(?::\d+)(?:\/\S*)?/gi;
    while ((m = urlRe.exec(message)) !== null) {
        const url = m[0].replace(/[.,;:)\]'"]+$/, '');
        if (!serviceURLs.has(url)) {
            serviceURLs.set(url, agentId);
            document.getElementById('svcSection').style.display = '';
        }
    }

    const portRe = /(?:PORT|port)\s*[=:]\s*(\d{2,5})/g;
    while ((m = portRe.exec(message)) !== null) {
        const url = `http://localhost:${m[1]}`;
        if (!serviceURLs.has(url)) {
            serviceURLs.set(url, agentId);
            document.getElementById('svcSection').style.display = '';
        }
    }

    // --- Deliverables (files created) ---
    const filePatterns = [
        /(?:Creat(?:ed?|ing)|writ(?:e|ing|ten)|wrote|Writ(?:e|ing))\s+(?:file:?\s*)?['"`]?([^\s'"`]+\.\w{1,10})/gi,
        /(?:write_file|create_file|writeFile)\s*\(\s*['"`]([^'"`]+)['"]/gi,
        /(?:saved?|generated?|output)\s+(?:to\s+)?['"`]?([^\s'"`]+\.\w{1,10})/gi,
    ];

    for (const re of filePatterns) {
        while ((m = re.exec(message)) !== null) {
            const file = m[1].trim();
            if (file.length < 3 || file.length > 120) continue;
            if (/^(the|a|an|to|in|of)$/i.test(file)) continue;
            if (!deliverables.has(agentId)) deliverables.set(agentId, new Set());
            deliverables.get(agentId).add(file);
            d.fileCount = deliverables.get(agentId).size;
        }
    }

    scheduleDashRender();
}

function updateDashAgentStatus(agentId, status) {
    const d = dashData[agentId];
    if (!d) return;
    d.status = status;
    if (status === 'working' && !d.startTime) d.startTime = Date.now();
    if (status === 'done' || status === 'error' || status === 'stopped') {
        if (d.startTime) d.elapsed = Date.now() - d.startTime;
    }
    scheduleDashRender();
}

function scheduleDashRender() {
    if (dashRenderPending) return;
    dashRenderPending = true;
    requestAnimationFrame(() => {
        dashRenderPending = false;
        renderDashboard();
    });
}

function toggleDashSection(headerEl) {
    const body = headerEl.nextElementSibling;
    const arrow = headerEl.querySelector('.dash-section-toggle');
    body.classList.toggle('collapsed');
    arrow.classList.toggle('collapsed');
}

function copyToClipboard(text, btn) {
    navigator.clipboard.writeText(text).then(() => {
        const orig = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(() => { btn.textContent = orig; }, 1200);
    });
}

function toggleDelivGroup(el) {
    const files = el.nextElementSibling;
    const toggle = el.querySelector('.deliv-toggle');
    files.classList.toggle('open');
    toggle.classList.toggle('open');
}

function renderDashboard() {
    renderPipelineBar();
    renderAgentGrid();
    renderSecPanel();
    renderSvcPanel();
    renderDelivPanel();
}

function renderPipelineBar() {
    const el = document.getElementById('pipelineBar');
    const agents = AGENTS;
    const doneCount = agents.filter(a => dashData[a.id]?.status === 'done').length;
    const errorCount = agents.filter(a => dashData[a.id]?.status === 'error').length;
    const stoppedCount = agents.filter(a => dashData[a.id]?.status === 'stopped').length;
    const workingCount = agents.filter(a => dashData[a.id]?.status === 'working').length;
    const finishedCount = doneCount + errorCount + stoppedCount;
    const total = agents.length;
    const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;

    let statusClass = 'idle';
    let statusLabel = 'IDLE';
    if (workingCount > 0 || (pipelineStartTime && finishedCount < total && finishedCount > 0)) {
        statusClass = 'running';
        statusLabel = 'RUNNING';
    }
    if (pipelineStartTime && finishedCount === total && doneCount > 0) {
        statusClass = 'complete';
        statusLabel = 'COMPLETE';
    }
    if (pipelineStartTime && stoppedCount === total) {
        statusClass = 'idle';
        statusLabel = 'STOPPED';
        stopDashTimer();
    }

    const isFinal = statusClass === 'complete' || statusLabel === 'STOPPED';
    const elapsed = pipelineStartTime
        ? (isFinal ? pipelineElapsed || (Date.now() - pipelineStartTime) : Date.now() - pipelineStartTime)
        : 0;
    if (isFinal && !pipelineElapsed) pipelineElapsed = elapsed;

    el.innerHTML = `
        <div class="pipeline-bar">
            <span class="pipeline-status-badge ${statusClass}">${statusLabel}</span>
            <div class="pipeline-stat">Time: <span class="val">${elapsed ? fmtTime(elapsed) : '--'}</span></div>
            <div class="pipeline-stat">Done: <span class="val">${doneCount}/${total}</span></div>
            ${errorCount ? `<div class="pipeline-stat" style="color:var(--red)">Errors: <span class="val" style="color:var(--red)">${errorCount}</span></div>` : ''}
            <div class="pipeline-progress-track">
                <div class="pipeline-progress-fill" style="width:${pct}%"></div>
            </div>
            <div class="pipeline-stat" style="font-weight:600;color:var(--text)">${pct}%</div>
        </div>`;
}

function renderAgentGrid() {
    const el = document.getElementById('agentGrid');
    el.innerHTML = AGENTS.map(a => {
        const d = dashData[a.id] || {};
        const st = d.status || 'idle';
        const cardClass = st === 'working' ? 'mc-working' : st === 'done' ? 'mc-done' : st === 'error' ? 'mc-error' : '';
        const badgeClass = st === 'working' ? 'b-working' : st === 'done' ? 'b-done' : st === 'error' ? 'b-error' : 'b-idle';
        const badgeText = st.charAt(0).toUpperCase() + st.slice(1);
        const elapsed = d.startTime
            ? (st === 'done' || st === 'error' ? fmtTime(d.elapsed) : fmtTime(Date.now() - d.startTime))
            : '--';
        const lastLine = d.lastLine ? (d.lastLine.length > 50 ? d.lastLine.substring(0, 50) + '\u2026' : d.lastLine) : '';
        return `
        <div class="mini-card ${cardClass}">
            <div class="mc-header">
                <span class="mc-name" style="color:${a.color}">${a.charName} <span style="color:var(--muted);font-family:Inter;font-size:7px">${a.name}</span></span>
                <span class="mc-badge ${badgeClass}">${badgeText}</span>
            </div>
            <div class="mc-stats">
                <span>&#9202; <span class="mc-val">${elapsed}</span></span>
                <span>&#9993; <span class="mc-val">${d.msgCount || 0}</span></span>
                <span>&#128196; <span class="mc-val">${d.fileCount || 0}</span></span>
            </div>
            <div class="mc-last">${escHtml(lastLine)}</div>
        </div>`;
    }).join('');
}

function renderSecPanel() {
    const el = document.getElementById('secPanel');
    if (secFindings.length === 0) {
        el.innerHTML = '<div class="dash-empty">No security findings yet</div>';
        return;
    }

    const counts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, INFO: 0 };
    secFindings.forEach(f => { counts[f.severity] = (counts[f.severity] || 0) + 1; });

    let html = '<div class="severity-bar">';
    for (const [sev, cnt] of Object.entries(counts)) {
        if (cnt === 0) continue;
        html += `<span class="sev-chip sev-${sev.toLowerCase()}"><span class="sev-count">${cnt}</span> ${sev}</span>`;
    }
    html += '</div>';

    secFindings.forEach(f => {
        const sevClass = 'fs-' + f.severity.toLowerCase();
        html += `
        <div class="finding-item">
            <span class="finding-sev ${sevClass}">${f.severity}</span>
            <div class="finding-body">
                <span class="finding-title">${escHtml(f.id)} ${escHtml(f.title)}</span>
                ${f.location ? `<div class="finding-loc">${escHtml(f.location)}</div>` : ''}
            </div>
        </div>`;
    });

    el.innerHTML = html;
}

function renderSvcPanel() {
    const el = document.getElementById('svcPanel');
    if (serviceURLs.size === 0) {
        el.innerHTML = '<div class="dash-empty">No services detected yet</div>';
        return;
    }

    let html = '<div class="svc-list">';
    for (const [url, agentId] of serviceURLs) {
        const agent = AGENTS.find(a => a.id === agentId);
        const from = agent ? agent.charName : agentId;
        html += `
        <div class="svc-item">
            <span style="font-size:13px">&#127760;</span>
            <a href="${escHtml(url)}" target="_blank" rel="noopener" class="svc-url">${escHtml(url)}</a>
            <span style="font-size:9px;color:var(--muted);flex-shrink:0">via ${escHtml(from)}</span>
            <button class="svc-copy" onclick="copyToClipboard('${url.replace(/'/g, "\\'")}', this)">Copy</button>
        </div>`;
    }
    html += '</div>';
    el.innerHTML = html;
}

function renderDelivPanel() {
    const el = document.getElementById('delivPanel');
    if (deliverables.size === 0) {
        el.innerHTML = '<div class="dash-empty">No deliverables yet</div>';
        return;
    }

    let html = '';
    for (const [agentId, files] of deliverables) {
        const agent = AGENTS.find(a => a.id === agentId);
        const name = agent ? `${agent.charName} (${agent.name})` : agentId;
        const color = agent ? agent.color : 'var(--text)';
        html += `
        <div class="deliv-group">
            <div class="deliv-agent" onclick="toggleDelivGroup(this)" style="color:${color}">
                <span class="deliv-toggle">&#9654;</span>
                ${escHtml(name)}
                <span class="deliv-count">${files.size}</span>
            </div>
            <div class="deliv-files">
                ${[...files].map(f => `<div class="deliv-file">${escHtml(f)}</div>`).join('')}
            </div>
        </div>`;
    }

    el.innerHTML = html;
}

function startDashTimer() {
    if (dashTimerHandle) return;
    dashTimerHandle = setInterval(() => {
        if (!pipelineStartTime) return;
        scheduleDashRender();
    }, 1000);
}

function stopDashTimer() {
    if (dashTimerHandle) {
        clearInterval(dashTimerHandle);
        dashTimerHandle = null;
    }
}
