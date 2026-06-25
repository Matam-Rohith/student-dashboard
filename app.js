/* ═══════════════════════════════════════════════════════════
   StudyHub — Student Dashboard  |  app.js
═══════════════════════════════════════════════════════════ */

// ── State ──────────────────────────────────────────────────
let grades     = JSON.parse(localStorage.getItem('sd_grades')    || '[]');
let attendance = JSON.parse(localStorage.getItem('sd_att')       || '[]');
let timetable  = JSON.parse(localStorage.getItem('sd_tt')        || '[]');
let todos      = JSON.parse(localStorage.getItem('sd_todos')     || '[]');
let todoFilter = 'all';

// ── Grade point map ────────────────────────────────────────
const GP = {
  'O':10,'A+':9,'A':8.5,'B+':8,'B':7.5,'C':7,'D':6,'F':0,
  'S':10,'E':9,
};
function toPoints(g) {
  if (GP[g.toUpperCase()] !== undefined) return GP[g.toUpperCase()];
  const n = parseFloat(g);
  return isNaN(n) ? 0 : Math.min(10, Math.max(0, n));
}

// ── Persist ────────────────────────────────────────────────
function save() {
  localStorage.setItem('sd_grades',    JSON.stringify(grades));
  localStorage.setItem('sd_att',       JSON.stringify(attendance));
  localStorage.setItem('sd_tt',        JSON.stringify(timetable));
  localStorage.setItem('sd_todos',     JSON.stringify(todos));
}

// ── Toast ──────────────────────────────────────────────────
function toast(msg, type = 'success') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  document.getElementById('toast-container').appendChild(el);
  setTimeout(() => {
    el.style.animation = 'slideOut .3s ease forwards';
    setTimeout(() => el.remove(), 300);
  }, 2600);
}

// ── Clock ──────────────────────────────────────────────────
function startClock() {
  function tick() {
    const n = new Date();
    document.getElementById('clock').textContent =
      n.toLocaleTimeString('en-US', { hour12: false });
  }
  tick(); setInterval(tick, 1000);
}

// ── Navigation ─────────────────────────────────────────────
const TITLES = {
  overview:'Overview', gpa:'GPA Tracker',
  attendance:'Attendance', timetable:'Timetable', todo:'To-Do List'
};
function switchTab(id) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + id).classList.add('active');
  document.querySelector(`[data-tab="${id}"]`).classList.add('active');
  document.getElementById('pageTitle').textContent = TITLES[id];
  if (id === 'overview') refreshOverview();
  if (id === 'gpa')      { renderGpaTable(); renderGpaBar(); }
  if (id === 'attendance'){ renderAttCards(); renderAttBar(); }
  if (id === 'timetable') renderTimetable();
  if (id === 'todo')      renderTodos();
}

// ── Sidebar / mobile ───────────────────────────────────────
function initSidebar() {
  const sb  = document.getElementById('sidebar');
  const ov  = document.getElementById('overlay');
  const ham = document.getElementById('hamburger');
  const cls = document.getElementById('closeSidebar');
  function open()  { sb.classList.add('open');  ov.classList.add('show'); }
  function close() { sb.classList.remove('open'); ov.classList.remove('show'); }
  ham.addEventListener('click', open);
  cls.addEventListener('click', close);
  ov.addEventListener('click',  close);
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      switchTab(btn.dataset.tab);
      if (window.innerWidth <= 768) close();
    });
  });
}

// ── Theme ──────────────────────────────────────────────────
function initTheme() {
  const saved = localStorage.getItem('sd_theme') || 'dark';
  applyTheme(saved);
  document.getElementById('themeToggle').addEventListener('click', () => {
    const cur = document.documentElement.dataset.theme;
    applyTheme(cur === 'dark' ? 'light' : 'dark');
  });
}
function applyTheme(t) {
  document.documentElement.dataset.theme = t;
  localStorage.setItem('sd_theme', t);
  document.getElementById('themeIcon').textContent  = t === 'dark' ? '☀️' : '🌙';
  document.getElementById('themeLabel').textContent = t === 'dark' ? 'Light Mode' : 'Dark Mode';
  rebuildCharts();
}

// ── Chart helpers ──────────────────────────────────────────
let chartRefs = {};
function destroyChart(key) {
  if (chartRefs[key]) { chartRefs[key].destroy(); delete chartRefs[key]; }
}
function isDark() { return document.documentElement.dataset.theme !== 'light'; }
function gridColor() { return isDark() ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.07)'; }
function tickColor()  { return isDark() ? '#94a3b8' : '#64748b'; }
function bgColor()    { return isDark() ? '#1e1e35' : '#ffffff'; }

// ── GPA ────────────────────────────────────────────────────
function addGrade() {
  const sub  = document.getElementById('gpa-subject').value.trim();
  const grd  = document.getElementById('gpa-grade').value.trim();
  const cred = parseFloat(document.getElementById('gpa-credits').value);
  if (!sub || !grd || isNaN(cred) || cred <= 0) { toast('Fill all GPA fields', 'error'); return; }
  grades.push({ sub, grd, cred, pts: toPoints(grd) }); save();
  ['gpa-subject','gpa-grade','gpa-credits'].forEach(id => document.getElementById(id).value = '');
  renderGpaTable(); renderGpaBar(); refreshOverview();
  toast(`Added ${sub}`, 'success');
}
function deleteGrade(i) {
  grades.splice(i, 1); save();
  renderGpaTable(); renderGpaBar(); refreshOverview();
  toast('Removed', 'info');
}
function calcGPA() {
  if (!grades.length) return null;
  const tw = grades.reduce((s,g) => s + g.cred, 0);
  const wp = grades.reduce((s,g) => s + g.pts * g.cred, 0);
  return tw ? (wp / tw).toFixed(2) : null;
}
function renderGpaTable() {
  const tb = document.getElementById('gpa-table-body');
  tb.innerHTML = grades.map((g,i) => `
    <tr>
      <td>${g.sub}</td><td>${g.grd}</td><td>${g.cred}</td><td>${g.pts.toFixed(1)}</td>
      <td><button class="btn btn--danger" onclick="deleteGrade(${i})">✕</button></td>
    </tr>`).join('');
  const gpa = calcGPA();
  document.getElementById('gpa-display').textContent = gpa ?? '--';
}
function renderGpaBar() {
  destroyChart('gradesBar');
  if (!grades.length) return;
  const ctx = document.getElementById('gradesBar').getContext('2d');
  chartRefs.gradesBar = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: grades.map(g => g.sub),
      datasets: [{ label: 'Grade Points', data: grades.map(g => g.pts),
        backgroundColor: grades.map((_,i) => `hsl(${240 + i*25},70%,60%)`),
        borderRadius: 6, borderSkipped: false }]
    },
    options: {
      responsive: true, plugins: { legend: { display: false } },
      scales: {
        y: { min: 0, max: 10, grid: { color: gridColor() }, ticks: { color: tickColor() } },
        x: { grid: { display: false }, ticks: { color: tickColor() } }
      }
    }
  });
}

// ── Attendance ─────────────────────────────────────────────
function addAttendance() {
  const sub  = document.getElementById('att-subject').value.trim();
  const pres = parseInt(document.getElementById('att-present').value);
  const tot  = parseInt(document.getElementById('att-total').value);
  if (!sub || isNaN(pres) || isNaN(tot) || tot <= 0 || pres > tot) { toast('Check attendance values', 'error'); return; }
  const existing = attendance.findIndex(a => a.sub === sub);
  if (existing >= 0) attendance[existing] = { sub, pres, tot };
  else attendance.push({ sub, pres, tot });
  save();
  ['att-subject','att-present','att-total'].forEach(id => document.getElementById(id).value = '');
  renderAttCards(); renderAttBar(); refreshOverview();
  toast(`Attendance saved for ${sub}`, 'success');
}
function deleteAtt(i) {
  attendance.splice(i, 1); save();
  renderAttCards(); renderAttBar(); refreshOverview();
  toast('Removed', 'info');
}
function renderAttCards() {
  const el = document.getElementById('att-cards');
  el.innerHTML = attendance.map((a,i) => {
    const pct = Math.round(a.pres / a.tot * 100);
    const cls = pct >= 75 ? 'safe' : pct >= 60 ? 'warn' : 'danger';
    return `<div class="att-card">
      <div class="att-card-top">
        <span class="att-sub">${a.sub}</span>
        <span class="att-pct ${cls}">${pct}%</span>
      </div>
      <div class="att-bar-track"><div class="att-bar-fill ${cls}" style="width:${pct}%"></div></div>
      <div class="att-info">${a.pres} / ${a.tot} classes attended
        <button class="btn btn--danger" style="padding:.15rem .5rem;font-size:.7rem;float:right" onclick="deleteAtt(${i})">✕</button>
      </div>
    </div>`;
  }).join('');
}
function renderAttBar() {
  destroyChart('attBar');
  if (!attendance.length) return;
  const ctx = document.getElementById('attBar').getContext('2d');
  const pcts = attendance.map(a => Math.round(a.pres / a.tot * 100));
  chartRefs.attBar = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: attendance.map(a => a.sub),
      datasets: [{ label: '% Attendance', data: pcts,
        backgroundColor: pcts.map(p => p >= 75 ? 'rgba(16,185,129,.7)' : p >= 60 ? 'rgba(245,158,11,.7)' : 'rgba(244,63,94,.7)'),
        borderRadius: 6, borderSkipped: false }]
    },
    options: {
      responsive: true, plugins: { legend: { display: false } },
      scales: {
        y: { min: 0, max: 100, grid: { color: gridColor() }, ticks: { color: tickColor(), callback: v => v + '%' } },
        x: { grid: { display: false }, ticks: { color: tickColor() } }
      }
    }
  });
}

// ── Timetable ──────────────────────────────────────────────
const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat'];
function addTimetable() {
  const day = document.getElementById('tt-day').value;
  const time = document.getElementById('tt-time').value;
  const sub  = document.getElementById('tt-subject').value.trim();
  const color = document.getElementById('tt-color').value;
  if (!time || !sub) { toast('Fill day, time & subject', 'error'); return; }
  timetable.push({ day, time, sub, color }); save();
  ['tt-time','tt-subject'].forEach(id => document.getElementById(id).value = '');
  renderTimetable();
  toast(`${sub} added to ${day}`, 'success');
}
function deleteTT(i) {
  timetable.splice(i, 1); save(); renderTimetable();
  toast('Removed', 'info');
}
function renderTimetable() {
  const grid = document.getElementById('timetable-grid');
  grid.innerHTML = DAYS.map(day => {
    const entries = timetable
      .map((e,i) => ({...e, i}))
      .filter(e => e.day === day)
      .sort((a,b) => a.time.localeCompare(b.time));
    return `<div class="tt-day-col">
      <div class="tt-day-header">${day}</div>
      <div class="tt-entries">${
        entries.length
          ? entries.map(e => `
              <div class="tt-entry ${e.color}">
                <span>${e.time} — ${e.sub}</span>
                <button class="tt-del" onclick="deleteTT(${e.i})">✕</button>
              </div>`).join('')
          : '<div style="font-size:.72rem;color:var(--text3);padding:.25rem">—</div>'
      }</div>
    </div>`;
  }).join('');
}

// ── Todo ───────────────────────────────────────────────────
function addTodo() {
  const text = document.getElementById('todo-text').value.trim();
  const due  = document.getElementById('todo-due').value;
  const pri  = document.getElementById('todo-priority').value;
  if (!text) { toast('Enter a task', 'error'); return; }
  todos.push({ text, due, pri, done: false, id: Date.now() }); save();
  document.getElementById('todo-text').value = '';
  document.getElementById('todo-due').value  = '';
  renderTodos(); refreshOverview();
  toast('Task added', 'success');
}
function toggleTodo(id) {
  const t = todos.find(t => t.id === id);
  if (t) { t.done = !t.done; save(); renderTodos(); refreshOverview(); }
}
function deleteTodo(id) {
  todos = todos.filter(t => t.id !== id); save();
  renderTodos(); refreshOverview();
  toast('Task removed', 'info');
}
function renderTodos() {
  let list = [...todos];
  if (todoFilter !== 'all') {
    if (todoFilter === 'done') list = list.filter(t => t.done);
    else list = list.filter(t => t.pri === todoFilter && !t.done);
  }
  const el = document.getElementById('todo-list');
  el.innerHTML = list.map(t => `
    <li class="todo-item ${t.done ? 'done' : ''}">
      <div class="priority-dot ${t.pri}"></div>
      <input type="checkbox" class="todo-check" ${t.done ? 'checked' : ''} onchange="toggleTodo(${t.id})" />
      <span class="todo-text">${t.text}</span>
      <div class="todo-meta">
        ${t.due ? `<span>📅 ${t.due}</span>` : ''}
      </div>
      <button class="todo-del" onclick="deleteTodo(${t.id})">🗑️</button>
    </li>`).join('');
  document.querySelectorAll('.filter-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.filter === todoFilter);
  });
}
function initTodoFilters() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      todoFilter = btn.dataset.filter;
      renderTodos();
    });
  });
}

// ── Overview ───────────────────────────────────────────────
function setRing(id, pct) {
  const el = document.getElementById(id);
  if (el) el.setAttribute('stroke-dasharray', `${pct} 100`);
}
function refreshOverview() {
  // GPA
  const gpa = calcGPA();
  document.getElementById('ov-gpa').textContent = gpa ?? '--';
  setRing('ov-gpa-ring', gpa ? (parseFloat(gpa) / 10 * 100) : 0);

  // Attendance avg
  const attAvg = attendance.length
    ? Math.round(attendance.reduce((s,a) => s + a.pres/a.tot*100, 0) / attendance.length)
    : null;
  document.getElementById('ov-att').textContent = attAvg != null ? attAvg + '%' : '--%';
  setRing('ov-att-ring', attAvg ?? 0);

  // Todos
  const done = todos.filter(t => t.done).length;
  const total = todos.length;
  document.getElementById('ov-tasks').textContent = `${done} / ${total}`;
  setRing('ov-tasks-ring', total ? Math.round(done/total*100) : 0);

  // Subjects
  const uniq = new Set(grades.map(g => g.sub)).size;
  document.getElementById('ov-subjects').textContent = uniq;
  setRing('ov-sub-ring', Math.min(100, uniq * 10));

  // Overview line chart
  destroyChart('gpaLine');
  const ctx1 = document.getElementById('gpaLineChart').getContext('2d');
  chartRefs.gpaLine = new Chart(ctx1, {
    type: 'bar',
    data: {
      labels: grades.length ? grades.map(g => g.sub) : ['No data'],
      datasets: [{
        label: 'Grade Points', fill: true,
        data: grades.length ? grades.map(g => g.pts) : [0],
        backgroundColor: 'rgba(99,102,241,.25)',
        borderColor: '#6366f1', borderWidth: 2,
        borderRadius: 6, borderSkipped: false,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { labels: { color: tickColor() } } },
      scales: {
        y: { min:0, max:10, grid:{color:gridColor()}, ticks:{color:tickColor()} },
        x: { grid:{display:false}, ticks:{color:tickColor()} }
      }
    }
  });

  // Donut
  destroyChart('attDonut');
  const ctx2 = document.getElementById('attDonut').getContext('2d');
  const present = attendance.reduce((s,a) => s + a.pres, 0);
  const absent  = attendance.reduce((s,a) => s + (a.tot - a.pres), 0);
  chartRefs.attDonut = new Chart(ctx2, {
    type: 'doughnut',
    data: {
      labels: ['Present','Absent'],
      datasets: [{
        data: present + absent ? [present, absent] : [1,0],
        backgroundColor: ['rgba(16,185,129,.8)','rgba(244,63,94,.6)'],
        borderWidth: 0, hoverOffset: 6
      }]
    },
    options: {
      responsive: true, cutout: '70%',
      plugins: {
        legend: { position: 'bottom', labels: { color: tickColor(), padding: 12, boxWidth: 10 } }
      }
    }
  });
}

function rebuildCharts() {
  const tab = document.querySelector('.tab-panel.active')?.id?.replace('tab-','');
  if (tab === 'overview')   refreshOverview();
  if (tab === 'gpa')        renderGpaBar();
  if (tab === 'attendance') renderAttBar();
}

// ── Boot ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  startClock();
  initSidebar();
  initTheme();
  initTodoFilters();
  refreshOverview();
  toast('Welcome back! 👋', 'info');
});
