// ===== EXPERIMENT WORKFLOW ENGINE =====
const EXP_KEY = 'devsecops_exp_v2';
const EXPERIMENTS = {
  1: {
    title: 'Repository & CI/CD Bootstrapping',
    phase: 'Setup', phaseClass: 'phase-recon',
    icon: 'git-branch', iconBg: 'rgba(16,185,129,0.12)', iconColor: '#34d399',
    objective: 'Set up a Flask application with a fully automated GitHub Actions CI/CD pipeline that triggers on every push.',
    files: ['app.py', '.github/workflows/ci.yml', 'Dockerfile', 'requirements.txt', 'sonar-project.properties'],
    commands: [
      'git init',
      'git remote add origin https://github.com/your-repo.git',
      'git add -A && git commit -m "Initial commit"',
      'git push -u origin main',
      '# Check GitHub → Actions tab for pipeline run'
    ],
    expected: 'GitHub Actions workflow triggers automatically. Build step completes with green checkmark. Docker image builds successfully.',
    checklist: [
      'Repository created on GitHub',
      'CI/CD workflow YAML added to .github/workflows/',
      'First push triggers automated build',
      'Dockerfile builds without errors',
      'Pipeline status shows green/passing'
    ]
  },
  2: {
    title: 'Reflected XSS Injection',
    phase: 'Attack', phaseClass: 'phase-attack',
    icon: 'terminal', iconBg: 'rgba(239,68,68,0.12)', iconColor: '#f87171',
    objective: 'Demonstrate a Reflected Cross-Site Scripting (XSS) vulnerability by injecting malicious JavaScript through an unsanitized search parameter.',
    files: ['app.py → /search route', 'templates/index.html → search form'],
    commands: [
      '# Navigate to the XSS test form below',
      '# Enter this payload in the search box:',
      '<script>alert("XSS")</script>',
      '# Or try: <img src=x onerror=alert(1)>',
      '# Observe: payload executes in browser'
    ],
    expected: 'Browser shows an alert popup confirming the XSS payload executed. The search query is reflected in the page without sanitization.',
    checklist: [
      'XSS payload entered in search form',
      'Alert popup triggered in browser',
      'Payload reflected in page output',
      'Understood why {{ query | safe }} is dangerous',
      'Documented the vulnerability finding'
    ]
  },
  3: {
    title: 'SQL Injection Auth Bypass',
    phase: 'Attack', phaseClass: 'phase-attack',
    icon: 'database', iconBg: 'rgba(239,68,68,0.12)', iconColor: '#f87171',
    objective: 'Bypass the login authentication by exploiting an SQL Injection vulnerability in the login endpoint that uses string interpolation instead of parameterized queries.',
    files: ['app.py → /login route', 'database.db → users table'],
    commands: [
      '# Go to the SQL Injection lab form below',
      '# Username field — enter:',
      "' OR '1'='1",
      '# Password field — enter anything',
      '# Click "Bypass Auth"',
      '# Try also: admin\'--',
      '# Try also: \' UNION SELECT username,password FROM users--'
    ],
    expected: 'Login is bypassed without valid credentials. The application returns a success message because the SQL query evaluates to TRUE for all rows.',
    payloads: [
      { label: 'Basic Bypass', value: "' OR '1'='1", desc: 'Makes WHERE clause always TRUE' },
      { label: 'Comment Bypass', value: "admin'--", desc: 'Comments out password check' },
      { label: 'Union Extract', value: "' UNION SELECT username,password FROM users--", desc: 'Extracts all credentials' },
      { label: 'Tautology', value: "' OR 1=1--", desc: 'Simple tautology attack' }
    ],
    checklist: [
      'Basic OR bypass tested successfully',
      'Login bypassed without valid password',
      'Understood string interpolation vulnerability',
      'Tested comment-based bypass (admin\'--)',
      'Identified mitigation: use parameterized queries'
    ]
  },
  4: {
    title: 'DAST Automated Scanning',
    phase: 'Detect', phaseClass: 'phase-defense',
    icon: 'scan', iconBg: 'rgba(99,102,241,0.12)', iconColor: '#818cf8',
    objective: 'Run the built-in Dynamic Application Security Testing (DAST) scanner against the running Flask application to automatically detect XSS and SQL Injection vulnerabilities.',
    files: ['app.py → /scan endpoint', 'Dashboard → DAST Scanner section'],
    commands: [
      '# Scroll down to "Automated Vulnerability Scanner (DAST)"',
      '# Set target URL: http://127.0.0.1:5000/search',
      '# Click "Start Security Scan"',
      '# Review XSS and SQLi scan results',
      '# Both should show VULNERABLE status'
    ],
    expected: 'Scanner detects both XSS and SQL Injection vulnerabilities. Results show VULNERABLE badges with detailed findings for each vulnerability type.',
    checklist: [
      'DAST scanner target URL configured',
      'Security scan executed successfully',
      'XSS vulnerability detected by scanner',
      'SQLi vulnerability detected by scanner',
      'Scan results reviewed and documented'
    ]
  },
  5: {
    title: 'SAST with SonarCloud',
    phase: 'Detect', phaseClass: 'phase-defense',
    icon: 'shield-check', iconBg: 'rgba(99,102,241,0.12)', iconColor: '#818cf8',
    objective: 'Perform Static Application Security Testing (SAST) using SonarCloud to identify code vulnerabilities, security hotspots, and code smells without running the application.',
    files: ['sonar-project.properties', '.github/workflows/ci.yml', 'app.py'],
    commands: [
      '# Push code to GitHub to trigger SonarCloud analysis',
      'git push origin main',
      '# Visit: https://sonarcloud.io/dashboard',
      '# Or: Use "Analyze Repository" button on dashboard',
      '# Review: Security hotspots, vulnerabilities, code smells'
    ],
    expected: 'SonarCloud flags security hotspots for SQL injection, XSS vulnerabilities, and hardcoded credentials. Code quality gate may fail due to critical findings.',
    checklist: [
      'SonarCloud project configured',
      'sonar-project.properties file created',
      'Analysis triggered via GitHub push',
      'Security hotspots reviewed',
      'Code quality gate results documented'
    ]
  },
  6: {
    title: 'SCA + Container Security Gate',
    phase: 'CI/CD', phaseClass: 'phase-cicd',
    icon: 'container', iconBg: 'rgba(245,158,11,0.12)', iconColor: '#fbbf24',
    objective: 'Scan application dependencies (SCA) and Docker container image for known CVEs. Configure the CI/CD pipeline to block deployment when critical vulnerabilities are found.',
    files: ['requirements.txt', 'Dockerfile', '.github/workflows/ci.yml'],
    commands: [
      '# Run dependency audit locally:',
      'pip install pip-audit',
      'pip-audit -r requirements.txt',
      '# Build and scan Docker image:',
      'docker build -t devsecops-app .',
      'trivy image devsecops-app',
      '# Check: CI pipeline should block on CRITICAL CVEs'
    ],
    expected: 'pip-audit reports vulnerable dependencies. Trivy finds CVEs in the Docker image. CI/CD pipeline security gate blocks deployment when critical vulnerabilities exist.',
    checklist: [
      'pip-audit installed and executed',
      'Dependency vulnerabilities identified',
      'Docker image built successfully',
      'Trivy container scan completed',
      'Security gate configured in CI/CD pipeline',
      'Pipeline blocks on CRITICAL severity CVEs'
    ]
  }
};

const STATUS_FLOW = ['pending', 'active', 'testing', 'done'];
const STATUS_LABELS = { pending: 'Pending', active: 'In Progress', testing: 'Testing', done: 'Completed' };
const STATUS_ICONS = { pending: 'circle', active: 'loader-2', testing: 'flask-conical', done: 'check-circle-2' };
const STATUS_CSS = { pending: 'step-pending', active: 'step-active', testing: 'step-warn', done: 'step-done' };
const NUM_CSS = { pending: 'step-num-pending', active: 'step-num-active', testing: 'step-num-active', done: 'step-num-done' };

function loadState() {
  try { const s = localStorage.getItem(EXP_KEY); if (s) return JSON.parse(s); } catch(e) {}
  return { exps: {1:'done',2:'pending',3:'pending',4:'pending',5:'pending',6:'pending'}, checklists: {} };
}
function saveState(st) { localStorage.setItem(EXP_KEY, JSON.stringify(st)); }

function getChecklist(expNum) {
  const st = loadState();
  return st.checklists[expNum] || EXPERIMENTS[expNum].checklist.map(() => false);
}
function setChecklist(expNum, arr) {
  const st = loadState();
  st.checklists[expNum] = arr;
  saveState(st);
}
function getExpStatus(n) { return loadState().exps[n] || 'pending'; }
function setExpStatus(n, status) {
  const st = loadState();
  st.exps[n] = status;
  saveState(st);
  renderAllSteps();
  updateProgress();
}

function nextStatus(n) {
  const cur = getExpStatus(n);
  const idx = STATUS_FLOW.indexOf(cur);
  if (idx < STATUS_FLOW.length - 1) setExpStatus(n, STATUS_FLOW[idx + 1]);
}

function renderAllSteps() {
  for (let i = 1; i <= 6; i++) {
    const el = document.querySelector('[data-exp="'+i+'"]');
    if (!el) continue;
    const status = getExpStatus(i);
    const numEl = el.querySelector('.exp-step-num');
    const statusEl = el.querySelector('.exp-step-status');
    numEl.className = 'exp-step-num ' + NUM_CSS[status];
    statusEl.className = 'exp-step-status ' + STATUS_CSS[status];
    if (status === 'done') {
      numEl.innerHTML = '<i data-lucide="check" style="width:14px;height:14px;"></i>';
    } else {
      numEl.textContent = i;
    }
    statusEl.innerHTML = '<i data-lucide="'+STATUS_ICONS[status]+'" style="width:11px;height:11px;"></i> '+STATUS_LABELS[status];
  }
  lucide.createIcons();
}

function updateProgress() {
  const st = loadState();
  const done = Object.values(st.exps).filter(s => s === 'done').length;
  const pct = Math.round((done/6)*100);
  const fill = document.getElementById('plan-progress-fill');
  const txt = document.getElementById('plan-progress-pct');
  if (fill) fill.style.width = pct+'%';
  if (txt) txt.textContent = done+' / 6 Done';
}

// ===== MODAL =====
function openExpModal(n) {
  const exp = EXPERIMENTS[n];
  const status = getExpStatus(n);
  const checks = getChecklist(n);
  const m = document.getElementById('exp-modal');
  
  let checklistHTML = exp.checklist.map((item, i) =>
    `<label class="ck-item ${checks[i]?'checked':''}" data-exp="${n}" data-idx="${i}">
      <input type="checkbox" ${checks[i]?'checked':''} onchange="toggleCheck(${n},${i},this.checked)">
      <span>${item}</span>
    </label>`
  ).join('');

  let payloadsHTML = '';
  if (exp.payloads) {
    payloadsHTML = `<div class="modal-section"><h4><i data-lucide="zap" style="width:15px;height:15px;"></i> Test Payloads (Educational Only)</h4>
      <div class="payload-grid">${exp.payloads.map(p =>
        `<div class="payload-card" onclick="copyPayload('${p.value.replace(/'/g,"\\'")}')">
          <div class="payload-label">${p.label}</div>
          <code class="payload-code">${p.value.replace(/</g,'&lt;')}</code>
          <div class="payload-desc">${p.desc}</div>
        </div>`
      ).join('')}</div></div>`;
  }

  let statusBtns = STATUS_FLOW.map(s =>
    `<button class="status-btn ${s===status?'active-status':''}" onclick="setExpStatus(${n},'${s}');openExpModal(${n})">
      <i data-lucide="${STATUS_ICONS[s]}" style="width:12px;height:12px;"></i> ${STATUS_LABELS[s]}
    </button>`
  ).join('');

  m.innerHTML = `
    <div class="modal-overlay" onclick="closeModal()"></div>
    <div class="modal-content">
      <div class="modal-header">
        <div class="modal-header-left">
          <span class="exp-phase-tag ${exp.phaseClass}">${exp.phase}</span>
          <h2>Exp ${n} — ${exp.title}</h2>
        </div>
        <button class="modal-close" onclick="closeModal()"><i data-lucide="x" style="width:20px;height:20px;"></i></button>
      </div>
      <div class="modal-status-bar">${statusBtns}</div>
      <div class="modal-body">
        <div class="modal-section">
          <h4><i data-lucide="target" style="width:15px;height:15px;"></i> Objective</h4>
          <p>${exp.objective}</p>
        </div>
        <div class="modal-section">
          <h4><i data-lucide="file-code" style="width:15px;height:15px;"></i> Required Files</h4>
          <div class="file-tags">${exp.files.map(f=>'<span class="file-tag">'+f+'</span>').join('')}</div>
        </div>
        <div class="modal-section">
          <h4><i data-lucide="terminal" style="width:15px;height:15px;"></i> Commands to Run</h4>
          <div class="cmd-block">${exp.commands.map(c=>'<div class="cmd-line">'+(c.startsWith('#')?'<span class="cmd-comment">'+c+'</span>':'<span class="cmd-prompt">$</span> '+c.replace(/</g,'&lt;'))+'</div>').join('')}</div>
        </div>
        ${payloadsHTML}
        <div class="modal-section">
          <h4><i data-lucide="monitor" style="width:15px;height:15px;"></i> Expected Output</h4>
          <p class="expected-box">${exp.expected}</p>
        </div>
        <div class="modal-section">
          <h4><i data-lucide="list-checks" style="width:15px;height:15px;"></i> Verification Checklist</h4>
          <div class="checklist-wrap">${checklistHTML}</div>
        </div>
        <div class="modal-actions">
          <button class="action-btn btn-start" onclick="nextStatus(${n});openExpModal(${n})"><i data-lucide="play" style="width:14px;height:14px;"></i> Advance Status</button>
          <button class="action-btn btn-complete" onclick="setExpStatus(${n},'done');openExpModal(${n})"><i data-lucide="check-circle-2" style="width:14px;height:14px;"></i> Mark Completed</button>
          <button class="action-btn btn-reset-one" onclick="resetOne(${n})"><i data-lucide="rotate-ccw" style="width:14px;height:14px;"></i> Reset This</button>
        </div>
      </div>
    </div>`;
  m.classList.add('open');
  document.body.style.overflow = 'hidden';
  lucide.createIcons();
}

function closeModal() {
  const m = document.getElementById('exp-modal');
  m.classList.remove('open');
  document.body.style.overflow = '';
}

function toggleCheck(expNum, idx, val) {
  const arr = getChecklist(expNum);
  arr[idx] = val;
  setChecklist(expNum, arr);
  const allDone = arr.every(v => v);
  if (allDone && getExpStatus(expNum) !== 'done') setExpStatus(expNum, 'done');
  openExpModal(expNum);
}

function resetOne(n) {
  const st = loadState();
  st.exps[n] = 'pending';
  st.checklists[n] = EXPERIMENTS[n].checklist.map(() => false);
  saveState(st);
  renderAllSteps();
  updateProgress();
  openExpModal(n);
}

function resetAll() {
  localStorage.removeItem(EXP_KEY);
  const st = loadState();
  st.exps[1] = 'done';
  saveState(st);
  renderAllSteps();
  updateProgress();
}

function copyPayload(val) {
  navigator.clipboard.writeText(val).then(() => {
    const t = document.createElement('div');
    t.className = 'copy-toast';
    t.textContent = 'Copied: ' + val;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2000);
  });
}

// ===== AUTO HOOKS =====
document.addEventListener('DOMContentLoaded', function() {
  renderAllSteps();
  updateProgress();

  // Exp2: XSS form
  const xssForm = document.querySelector('form[action="/search"]');
  if (xssForm) xssForm.addEventListener('submit', () => {
    if (getExpStatus(2) === 'pending') setExpStatus(2, 'active');
  });

  // Exp3: SQLi form
  const sqliForm = document.querySelector('form[action="/login"]');
  if (sqliForm) sqliForm.addEventListener('submit', () => {
    if (getExpStatus(3) === 'pending') setExpStatus(3, 'active');
    localStorage.setItem('exp3_submitted','1');
  });
  if (localStorage.getItem('exp3_submitted') === '1') {
    if (getExpStatus(3) === 'active') setExpStatus(3, 'testing');
    localStorage.removeItem('exp3_submitted');
  }

  // Exp4: DAST scan
  const scanBtn = document.getElementById('btn-start-scan');
  if (scanBtn) scanBtn.addEventListener('click', () => {
    if (getExpStatus(4) === 'pending') setExpStatus(4, 'active');
  }, true);

  // Exp5: Repo analysis
  const fetchBtn = document.getElementById('btn-fetch-metrics');
  if (fetchBtn) fetchBtn.addEventListener('click', () => {
    if (getExpStatus(5) === 'pending') setExpStatus(5, 'active');
  }, true);

  // Jinja check
  const qEl = document.getElementById('jinja-query-flag');
  if (qEl && qEl.dataset.query) {
    if (getExpStatus(2) !== 'done') setExpStatus(2, 'done');
  }

  // Keyboard close modal
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
});
