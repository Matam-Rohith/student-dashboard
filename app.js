/* ═══════════════════════════════════════════════════════════
   StudyHub — Student Dashboard  |  app.js  v2
═══════════════════════════════════════════════════════════ */

// ── State ────────────────────────────────────────────────
let grades     = JSON.parse(localStorage.getItem('sd_grades')    || '[]');
let attendance = JSON.parse(localStorage.getItem('sd_att')       || '[]');
let timetable  = JSON.parse(localStorage.getItem('sd_tt')        || '[]');
let todos      = JSON.parse(localStorage.getItem('sd_todos')     || '[]');
let subjects   = JSON.parse(localStorage.getItem('sd_subjects')  || '[]');
let notes      = JSON.parse(localStorage.getItem('sd_notes')     || '[]');
let studyMins  = parseInt(localStorage.getItem('sd_study_mins')  || '0');
let streak     = parseInt(localStorage.getItem('sd_streak')      || '0');
let lastStudy  = localStorage.getItem('sd_last_study')           || '';
let todoFilter = 'all';

// ── Grade point map ──────────────────────────────────────
const GP = {'O':10,'A+':9,'A':8.5,'B+':8,'B':7.5,'C':7,'D':6,'F':0,'S':10,'E':9};
function toPoints(g) {
  const up = g.toUpperCase();
  if (GP[up] !== undefined) return GP[up];
  const n = parseFloat(g);
  return isNaN(n) ? 0 : Math.min(10, Math.max(0, n));
}

// ── Persist ──────────────────────────────────────────────
function save() {
  localStorage.setItem('sd_grades',    JSON.stringify(grades));
  localStorage.setItem('sd_att',       JSON.stringify(attendance));
  localStorage.setItem('sd_tt',        JSON.stringify(timetable));
  localStorage.setItem('sd_todos',     JSON.stringify(todos));
  localStorage.setItem('sd_subjects',  JSON.stringify(subjects));
  localStorage.setItem('sd_notes',     JSON.stringify(notes));
  localStorage.setItem('sd_study_mins',String(studyMins));
  localStorage.setItem('sd_streak',    String(streak));
  localStorage.setItem('sd_last_study',lastStudy);
}

// ── Toast ────────────────────────────────────────────────
function toast(msg, type = 'success') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  document.getElementById('toast-container').appendChild(el);
  setTimeout(() => {
    el.style.animation = 'slideOut .3s ease forwards';
    setTimeout(() => el.remove(), 300);
  }, 2800);
}

// ── Clock ────────────────────────────────────────────────
function startClock() {
  function tick() {
    document.getElementById('clock').textContent =
      new Date().toLocaleTimeString('en-US', { hour12: false });
  }
  tick(); setInterval(tick, 1000);
}

// ── Motivational Quotes ──────────────────────────────────
const QUOTES = [
  '"The secret of getting ahead is getting started." — Mark Twain',
  '"It always seems impossible until it\'s done." — Nelson Mandela',
  '"Success is the sum of small efforts repeated day in and day out." — Robert Collier',
  '"Believe you can and you\'re halfway there." — Theodore Roosevelt',
  '"Hard work beats talent when talent doesn\'t work hard." — Tim Notke',
  '"Push yourself, because no one else is going to do it for you."',
  '"Dream it. Wish it. Do it."',
  '"The expert in anything was once a beginner."',
  '"Don\'t watch the clock; do what it does. Keep going." — Sam Levenson',
  '"Great things never come from comfort zones."',
];
function showQuote() {
  const q = QUOTES[new Date().getDate() % QUOTES.length];
  const el = document.getElementById('quoteBanner');
  if (el) el.textContent = q;
}

// ── Streak ───────────────────────────────────────────────
function updateStreak() {
  const today = new Date().toDateString();
  if (lastStudy === today) return;
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  if (lastStudy === yesterday) streak++;
  else if (lastStudy !== today) streak = 1;
  lastStudy = today;
  save();
  document.getElementById('streakCount').textContent = streak;
}
function initStreak() {
  document.getElementById('streakCount').textContent = streak;
}

// ── Study Timer ──────────────────────────────────────────
let timerInterval = null;
let timerRunning = false;
let timerSeconds = 25 * 60;
let sessionsDone = parseInt(localStorage.getItem('sd_sessions') || '0');

function initTimer() {
  document.getElementById('timerSessions').textContent = sessionsDone;
  renderTimerDisplay();
  document.getElementById('timerMode').addEventListener('change', function() {
    if (!timerRunning) {
      timerSeconds = parseInt(this.value) * 60;
      renderTimerDisplay();
    }
  });
  document.getElementById('timerStart').addEventListener('click', () => {
    if (timerRunning) return;
    timerRunning = true;
    updateStreak();
    timerInterval = setInterval(() => {
      timerSeconds--;
      renderTimerDisplay();
      if (timerSeconds <= 0) {
        clearInterval(timerInterval);
        timerRunning = false;
        sessionsDone++;
        localStorage.setItem('sd_sessions', sessionsDone);
        document.getElementById('timerSessions').textContent = sessionsDone;
        const mins = parseInt(document.getElementById('timerMode').value);
        studyMins += mins;
        save();
        refreshOverview();
        toast(`\u23F1\uFE0F Session complete! +${mins} mins logged`, 'success');
        timerSeconds = mins * 60;
        renderTimerDisplay();
      }
    }, 1000);
  });
  document.getElementById('timerPause').addEventListener('click', () => {
    if (!timerRunning) return;
    clearInterval(timerInterval);
    timerRunning = false;
    toast('Timer paused', 'info');
  });
  document.getElementById('timerReset').addEventListener('click', () => {
    clearInterval(timerInterval);
    timerRunning = false;
    timerSeconds = parseInt(document.getElementById('timerMode').value) * 60;
    renderTimerDisplay();
  });
}
function renderTimerDisplay() {
  const m = String(Math.floor(timerSeconds / 60)).padStart(2, '0');
  const s = String(timerSeconds % 60).padStart(2, '0');
  document.getElementById('timerDisplay').textContent = `${m}:${s}`;
}

// ── Navigation ───────────────────────────────────────────
const TITLES = {
  overview:'Overview', subjects:'Subjects', gpa:'GPA Tracker',
  attendance:'Attendance', timetable:'Timetable',
  todo:'To-Do List', analytics:'Analytics', notes:'Notes'
};
function switchTab(id) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + id).classList.add('active');
  document.querySelector(`[data-tab="${id}"]`).classList.add('active');
  document.getElementById('pageTitle').textContent = TITLES[id];
  if (id === 'overview')   { refreshOverview(); }
  if (id === 'subjects')   renderSubjects();
  if (id === 'gpa')        { renderGpaTable(); renderGpaBar(); }
  if (id === 'attendance') { renderAttCards(); renderAttBar(); }
  if (id === 'timetable')  renderTimetable();
  if (id === 'todo')       renderTodos();
  if (id === 'analytics')  renderAnalytics();
  if (id === 'notes')      { populateNoteSubjectSelect(); renderNotes(); }
}

// ── Sidebar / mobile ─────────────────────────────────────
function initSidebar() {
  const sb  = document.getElementById('sidebar');
  const ov  = document.getElementById('overlay');
  const ham = document.getElementById('hamburger');
  const cls = document.getElementById('closeSidebar');
  function open()  { sb.classList.add('open');  ov.classList.add('show'); }
  function close() { sb.classList.remove('open'); ov.classList.remove('show'); }
  ham.addEventListener('click', open);
  cls.addEventListener('click', close);
  ov.addEventListener('click', close);
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      switchTab(btn.dataset.tab);
      if (window.innerWidth <= 768) close();
    });
  });
}

// ── Theme ────────────────────────────────────────────────
function initTheme() {
  applyTheme(localStorage.getItem('sd_theme') || 'dark');
  document.getElementById('themeToggle').addEventListener('click', () => {
    applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
  });
}
function applyTheme(t) {
  document.documentElement.dataset.theme = t;
  localStorage.setItem('sd_theme', t);
  document.getElementById('themeIcon').textContent  = t === 'dark' ? '\u2600\uFE0F' : '\uD83C\uDF19';
  document.getElementById('themeLabel').textContent = t === 'dark' ? 'Light Mode' : 'Dark Mode';
  rebuildCharts();
}

// ── Chart helpers ────────────────────────────────────────
let chartRefs = {};
function destroyChart(key) { if (chartRefs[key]) { chartRefs[key].destroy(); delete chartRefs[key]; } }
function isDark()     { return document.documentElement.dataset.theme !== 'light'; }
function gridColor()  { return isDark() ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.07)'; }
function tickColor()  { return isDark() ? '#94a3b8' : '#64748b'; }

// ── SUBJECTS ─────────────────────────────────────────────
function addSubject() {
  const name    = document.getElementById('sub-name').value.trim();
  const code    = document.getElementById('sub-code').value.trim();
  const credits = parseFloat(document.getElementById('sub-credits').value);
  const color   = document.getElementById('sub-color').value;
  const teacher = document.getElementById('sub-teacher').value.trim();
  if (!name) { toast('Enter subject name', 'error'); return; }
  subjects.push({ name, code, credits: isNaN(credits) ? 0 : credits, color, teacher, id: Date.now() });
  save();
  ['sub-name','sub-code','sub-credits','sub-teacher'].forEach(id => document.getElementById(id).value = '');
  renderSubjects();
  populateNoteSubjectSelect();
  toast(`${name} added`, 'success');
}
function deleteSubject(id) {
  subjects = subjects.filter(s => s.id !== id); save();
  renderSubjects(); toast('Removed', 'info');
}
function renderSubjects() {
  const grid = document.getElementById('subjects-grid');
  if (!grid) return;
  if (!subjects.length) { grid.innerHTML = '<p style="color:var(--text3);font-size:.82rem">No subjects yet. Add one above.</p>'; return; }
  grid.innerHTML = subjects.map(s => `
    <div class="subject-card">
      <div class="subject-card-color ${s.color}"></div>
      <div class="sub-name">${s.name}</div>
      <div class="sub-meta">${s.code ? s.code + ' &middot; ' : ''}${s.credits || 0} credits${s.teacher ? ' &middot; ' + s.teacher : ''}</div>
      <div style="margin-top:.75rem;display:flex;gap:.5rem">
        <button class="btn btn--danger" style="padding:.2rem .6rem;font-size:.72rem" onclick="deleteSubject(${s.id})">Remove</button>
      </div>
    </div>`).join('');
}
function populateNoteSubjectSelect() {
  const sel = document.getElementById('note-subject');
  if (!sel) return;
  sel.innerHTML = '<option value="">No subject</option>' +
    subjects.map(s => `<option value="${s.name}">${s.name}</option>`).join('');
}

// ── GPA ──────────────────────────────────────────────────
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
  tb.innerHTML = grades.map((g,i) => `<tr>
    <td>${g.sub}</td><td>${g.grd}</td><td>${g.cred}</td><td>${g.pts.toFixed(1)}</td>
    <td><button class="btn btn--danger" onclick="deleteGrade(${i})">\u2715</button></td>
  </tr>`).join('');
  document.getElementById('gpa-display').textContent = calcGPA() ?? '--';
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
        backgroundColor: grades.map((_,i) => `hsl(${240+i*25},70%,60%)`),
        borderRadius: 6, borderSkipped: false }]
    },
    options: { responsive: true, plugins: { legend: { display: false } },
      scales: {
        y: { min:0, max:10, grid:{color:gridColor()}, ticks:{color:tickColor()} },
        x: { grid:{display:false}, ticks:{color:tickColor()} }
      }
    }
  });
}
function predictGrade() {
  const target = parseFloat(document.getElementById('pred-target').value);
  const el = document.getElementById('pred-result');
  if (isNaN(target) || target < 0 || target > 10) { el.textContent = 'Enter a valid target (0-10)'; return; }
  if (!grades.length) { el.textContent = 'Add grades first'; return; }
  const tw = grades.reduce((s,g) => s + g.cred, 0);
  const wp = grades.reduce((s,g) => s + g.pts * g.cred, 0);
  const assumedCredits = tw / grades.length || 3;
  const neededPts = ((target * (tw + assumedCredits)) - wp) / assumedCredits;
  if (neededPts > 10) el.textContent = `You need ${neededPts.toFixed(1)}/10 — very tough! Push hard!`;
  else if (neededPts < 0) el.textContent = `You already exceed ${target} GPA! \uD83C\uDF89`;
  else el.textContent = `Need \u2248${neededPts.toFixed(1)}/10 in next subject to reach ${target} GPA`;
}
function exportGPA() {
  if (!grades.length) { toast('No grades to export', 'error'); return; }
  const rows = ['Subject,Grade,Credits,Points', ...grades.map(g => `${g.sub},${g.grd},${g.cred},${g.pts}`)];
  const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = 'grades.csv'; a.click();
  toast('CSV exported!', 'success');
}

// ── ATTENDANCE ───────────────────────────────────────────
function addAttendance() {
  const sub  = document.getElementById('att-subject').value.trim();
  const pres = parseInt(document.getElementById('att-present').value);
  const tot  = parseInt(document.getElementById('att-total').value);
  if (!sub || isNaN(pres) || isNaN(tot) || tot <= 0 || pres > tot) { toast('Check attendance values', 'error'); return; }
  const idx = attendance.findIndex(a => a.sub === sub);
  if (idx >= 0) attendance[idx] = { sub, pres, tot };
  else attendance.push({ sub, pres, tot });
  save();
  ['att-subject','att-present','att-total'].forEach(id => document.getElementById(id).value = '');
  renderAttCards(); renderAttBar(); refreshOverview();
  toast(`Attendance saved for ${sub}`, 'success');
}
function deleteAtt(i) { attendance.splice(i,1); save(); renderAttCards(); renderAttBar(); refreshOverview(); toast('Removed','info'); }
function renderAttCards() {
  // Summary pills
  const row = document.getElementById('att-summary-row');
  if (row) {
    const safe = attendance.filter(a => a.pres/a.tot >= .75).length;
    const warn = attendance.filter(a => { const p=a.pres/a.tot; return p>=.6&&p<.75; }).length;
    const danger = attendance.filter(a => a.pres/a.tot < .6).length;
    row.innerHTML = `
      <span class="att-summary-pill" style="background:rgba(16,185,129,.12);color:var(--green);border-color:rgba(16,185,129,.3)">${safe} \u2265 75%</span>
      <span class="att-summary-pill" style="background:rgba(245,158,11,.12);color:var(--amber);border-color:rgba(245,158,11,.3)">${warn} 60-75%</span>
      <span class="att-summary-pill" style="background:rgba(244,63,94,.12);color:var(--rose);border-color:rgba(244,63,94,.3)">${danger} < 60%</span>`;
  }
  const el = document.getElementById('att-cards');
  el.innerHTML = attendance.map((a,i) => {
    const pct = Math.round(a.pres/a.tot*100);
    const cls = pct>=75?'safe':pct>=60?'warn':'danger';
    const needed = Math.ceil((0.75*a.tot - a.pres)/(1-0.75));
    const tip = pct>=75 ? `Can skip ${Math.floor((a.pres-0.75*a.tot)/0.25)} more` : `Attend ${needed} more to reach 75%`;
    return `<div class="att-card">
      <div class="att-card-top"><span class="att-sub">${a.sub}</span><span class="att-pct ${cls}">${pct}%</span></div>
      <div class="att-bar-track"><div class="att-bar-fill ${cls}" style="width:${pct}%"></div></div>
      <div class="att-info">${a.pres}/${a.tot} classes &nbsp;&bull;&nbsp; ${tip}
        <button class="btn btn--danger" style="padding:.15rem .5rem;font-size:.7rem;float:right" onclick="deleteAtt(${i})">\u2715</button>
      </div></div>`;
  }).join('');
}
function renderAttBar() {
  destroyChart('attBar');
  if (!attendance.length) return;
  const ctx = document.getElementById('attBar').getContext('2d');
  const pcts = attendance.map(a => Math.round(a.pres/a.tot*100));
  chartRefs.attBar = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: attendance.map(a => a.sub),
      datasets: [{ label: '% Attendance', data: pcts,
        backgroundColor: pcts.map(p => p>=75?'rgba(16,185,129,.7)':p>=60?'rgba(245,158,11,.7)':'rgba(244,63,94,.7)'),
        borderRadius: 6, borderSkipped: false }]
    },
    options: { responsive: true, plugins: { legend:{display:false} },
      scales: {
        y: { min:0, max:100, grid:{color:gridColor()}, ticks:{color:tickColor(),callback:v=>v+'%'} },
        x: { grid:{display:false}, ticks:{color:tickColor()} }
      }
    }
  });
}

// ── TIMETABLE ────────────────────────────────────────────
const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat'];
const DAY_NAMES = { Mon:'Monday',Tue:'Tuesday',Wed:'Wednesday',Thu:'Thursday',Fri:'Friday',Sat:'Saturday' };
function addTimetable() {
  const day   = document.getElementById('tt-day').value;
  const time  = document.getElementById('tt-time').value;
  const sub   = document.getElementById('tt-subject').value.trim();
  const room  = document.getElementById('tt-room').value.trim();
  const color = document.getElementById('tt-color').value;
  if (!time || !sub) { toast('Fill time & subject', 'error'); return; }
  timetable.push({ day, time, sub, room, color }); save();
  ['tt-time','tt-subject','tt-room'].forEach(id => document.getElementById(id).value = '');
  renderTimetable();
  toast(`${sub} added to ${day}`, 'success');
}
function deleteTT(i) { timetable.splice(i,1); save(); renderTimetable(); toast('Removed','info'); }
function renderTimetable() {
  // Today's classes strip
  const todayIdx = new Date().getDay(); // 0=Sun
  const dayMap = [null,'Mon','Tue','Wed','Thu','Fri','Sat'];
  const todayKey = dayMap[todayIdx];
  const todayEl = document.getElementById('today-classes');
  if (todayEl) {
    const todayEntries = timetable.filter(e => e.day === todayKey).sort((a,b)=>a.time.localeCompare(b.time));
    todayEl.innerHTML = `<h4>Today's Classes (${todayKey ? DAY_NAMES[todayKey] : 'Weekend'})</h4>
      <div class="today-list">${
        todayEntries.length
          ? todayEntries.map(e=>`<span class="today-chip tt-entry ${e.color}">${e.time} ${e.sub}${e.room?' — '+e.room:''}</span>`).join('')
          : '<span style="font-size:.78rem;color:var(--text3)">No classes today 🎉</span>'
      }</div>`;
  }
  const grid = document.getElementById('timetable-grid');
  grid.innerHTML = DAYS.map(day => {
    const entries = timetable.map((e,i)=>({...e,i})).filter(e=>e.day===day).sort((a,b)=>a.time.localeCompare(b.time));
    return `<div class="tt-day-col">
      <div class="tt-day-header">${day}</div>
      <div class="tt-entries">${
        entries.length
          ? entries.map(e=>`<div class="tt-entry ${e.color}">
              <span>${e.time}${e.room?' · '+e.room:''}<br><strong>${e.sub}</strong></span>
              <button class="tt-del" onclick="deleteTT(${e.i})">\u2715</button></div>`).join('')
          : '<div style="font-size:.72rem;color:var(--text3);padding:.25rem">&mdash;</div>'
      }</div></div>`;
  }).join('');
}

// ── TODO ─────────────────────────────────────────────────
function addTodo() {
  const text = document.getElementById('todo-text').value.trim();
  const subj = document.getElementById('todo-subject').value.trim();
  const due  = document.getElementById('todo-due').value;
  const pri  = document.getElementById('todo-priority').value;
  if (!text) { toast('Enter a task', 'error'); return; }
  todos.push({ text, subj, due, pri, done: false, id: Date.now() }); save();
  document.getElementById('todo-text').value = '';
  document.getElementById('todo-due').value  = '';
  document.getElementById('todo-subject').value = '';
  renderTodos(); refreshOverview();
  toast('Task added', 'success');
}
function toggleTodo(id) {
  const t = todos.find(t=>t.id===id);
  if (t) { t.done=!t.done; save(); renderTodos(); refreshOverview(); }
}
function deleteTodo(id) {
  todos = todos.filter(t=>t.id!==id); save();
  renderTodos(); refreshOverview(); toast('Task removed','info');
}
function isOverdue(t) {
  return !t.done && t.due && new Date(t.due) < new Date(new Date().toDateString());
}
function renderTodos() {
  // Stats pills
  const statsEl = document.getElementById('todo-stats-row');
  if (statsEl) {
    const done = todos.filter(t=>t.done).length;
    const over = todos.filter(isOverdue).length;
    statsEl.innerHTML = `
      <span class="todo-stat-pill" style="background:rgba(99,102,241,.12);color:var(--primary);border-color:rgba(99,102,241,.3)">${todos.length} Total</span>
      <span class="todo-stat-pill" style="background:rgba(16,185,129,.12);color:var(--green);border-color:rgba(16,185,129,.3)">${done} Done</span>
      <span class="todo-stat-pill" style="background:rgba(244,63,94,.12);color:var(--rose);border-color:rgba(244,63,94,.3)">${over} Overdue</span>`;
  }
  let list = [...todos];
  if (todoFilter === 'done')   list = list.filter(t=>t.done);
  else if (todoFilter === 'overdue') list = list.filter(isOverdue);
  else if (todoFilter !== 'all') list = list.filter(t=>t.pri===todoFilter && !t.done);
  const el = document.getElementById('todo-list');
  el.innerHTML = list.map(t => {
    const over = isOverdue(t);
    return `<li class="todo-item ${t.done?'done':''} ${over?'overdue-item':''}">
      <div class="priority-dot ${t.pri}"></div>
      <input type="checkbox" class="todo-check" ${t.done?'checked':''} onchange="toggleTodo(${t.id})" />
      <span class="todo-text">${t.text}${t.subj?` <span style="font-size:.72rem;color:var(--text3)">(${t.subj})</span>`:''}</span>
      <div class="todo-meta">
        ${t.due?`<span>\uD83D\uDCC5 ${t.due}</span>`:''}
        ${over?'<span class="overdue-tag">Overdue</span>':''}
      </div>
      <button class="todo-del" onclick="deleteTodo(${t.id})">\uD83D\uDDD1\uFE0F</button>
    </li>`;
  }).join('');
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.toggle('active', b.dataset.filter===todoFilter));
}
function initTodoFilters() {
  document.querySelectorAll('.filter-btn').forEach(btn =>
    btn.addEventListener('click', () => { todoFilter = btn.dataset.filter; renderTodos(); }));
}

// ── ANALYTICS ────────────────────────────────────────────
function renderAnalytics() {
  // GPA Radar
  destroyChart('gpaRadar');
  if (grades.length) {
    const ctx = document.getElementById('gpaRadar').getContext('2d');
    chartRefs.gpaRadar = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: grades.map(g=>g.sub),
        datasets: [
          { label:'Your Points', data:grades.map(g=>g.pts), borderColor:'#6366f1', backgroundColor:'rgba(99,102,241,.2)', pointBackgroundColor:'#6366f1' },
          { label:'Max (10)', data:grades.map(()=>10), borderColor:'rgba(255,255,255,.15)', backgroundColor:'transparent', borderDash:[4,4] }
        ]
      },
      options: { responsive:true, scales:{ r:{ min:0, max:10, grid:{color:gridColor()}, pointLabels:{color:tickColor()}, ticks:{color:tickColor(),backdropColor:'transparent'} }},
        plugins:{ legend:{ labels:{ color:tickColor() } } } }
    });
  }
  // Credit Pie
  destroyChart('creditPie');
  if (grades.length) {
    const ctx = document.getElementById('creditPie').getContext('2d');
    chartRefs.creditPie = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: grades.map(g=>g.sub),
        datasets: [{ data:grades.map(g=>g.cred),
          backgroundColor: grades.map((_,i)=>`hsl(${200+i*35},70%,55%)`),
          borderWidth:0, hoverOffset:8 }]
      },
      options:{ responsive:true, cutout:'65%', plugins:{ legend:{ position:'bottom', labels:{ color:tickColor(), padding:8, boxWidth:10 } } } }
    });
  }
  // Attendance heatmap (horizontal bar)
  destroyChart('attHeat');
  if (attendance.length) {
    const ctx = document.getElementById('attHeat').getContext('2d');
    const pcts = attendance.map(a=>Math.round(a.pres/a.tot*100));
    chartRefs.attHeat = new Chart(ctx, {
      type:'bar',
      data:{
        labels:attendance.map(a=>a.sub),
        datasets:[{ label:'Attendance %', data:pcts, indexAxis:'y',
          backgroundColor:pcts.map(p=>p>=75?'rgba(16,185,129,.7)':p>=60?'rgba(245,158,11,.7)':'rgba(244,63,94,.7)'),
          borderRadius:4 }]
      },
      options:{ responsive:true, indexAxis:'y', plugins:{legend:{display:false}},
        scales:{ x:{min:0,max:100,grid:{color:gridColor()},ticks:{color:tickColor(),callback:v=>v+'%'}}, y:{grid:{display:false},ticks:{color:tickColor()}} } }
    });
  }
  // Todo priority pie
  destroyChart('todoPie');
  if (todos.length) {
    const h = todos.filter(t=>t.pri==='high').length;
    const m = todos.filter(t=>t.pri==='medium').length;
    const l = todos.filter(t=>t.pri==='low').length;
    const ctx = document.getElementById('todoPie').getContext('2d');
    chartRefs.todoPie = new Chart(ctx, {
      type:'doughnut',
      data:{ labels:['High','Medium','Low'],
        datasets:[{ data:[h,m,l], backgroundColor:['rgba(244,63,94,.8)','rgba(245,158,11,.8)','rgba(16,185,129,.8)'], borderWidth:0, hoverOffset:6 }] },
      options:{ responsive:true, cutout:'65%', plugins:{ legend:{ position:'bottom', labels:{ color:tickColor(), padding:8, boxWidth:10 } } } }
    });
  }
  // Smart Insights
  generateInsights();
}
function generateInsights() {
  const el = document.getElementById('insights-card');
  if (!el) return;
  const insights = [];
  const gpa = calcGPA();
  if (gpa) {
    const g = parseFloat(gpa);
    if (g >= 9)   insights.push({ icon:'\uD83C\uDF1F', text:`Excellent! Your GPA is ${gpa}/10. Keep up the outstanding work!` });
    else if (g>=7) insights.push({ icon:'\uD83D\uDCAA', text:`Good GPA of ${gpa}/10. A little more effort can push you to 9+!` });
    else           insights.push({ icon:'\u26A0\uFE0F', text:`Your GPA is ${gpa}/10. Focus on weaker subjects to improve.` });
  }
  const lowAtt = attendance.filter(a=>a.pres/a.tot<0.75);
  if (lowAtt.length) insights.push({ icon:'\uD83D\uDEA8', text:`Attendance below 75% in: ${lowAtt.map(a=>a.sub).join(', ')}. Attend more classes!` });
  const overdue = todos.filter(isOverdue);
  if (overdue.length) insights.push({ icon:'\u23F0', text:`${overdue.length} overdue task${overdue.length>1?'s':''}: ${overdue.map(t=>t.text).slice(0,3).join(', ')}` });
  const highPri = todos.filter(t=>t.pri==='high'&&!t.done);
  if (highPri.length) insights.push({ icon:'\uD83D\uDD34', text:`${highPri.length} high-priority task${highPri.length>1?'s':''} pending. Tackle them first!` });
  const hrs = Math.floor(studyMins/60);
  if (hrs >= 10) insights.push({ icon:'\uD83D\uDCDA', text:`You've studied ${hrs} hours total. Great dedication!` });
  if (!insights.length) insights.push({ icon:'\uD83D\uDC4B', text:'Add grades, attendance & todos to unlock personalized insights.' });
  el.innerHTML = `<h3>\uD83D\uDCA1 Smart Insights</h3>` +
    insights.map(i=>`<div class="insight-item"><span class="insight-icon">${i.icon}</span><span class="insight-text">${i.text}</span></div>`).join('');
}

// ── NOTES ────────────────────────────────────────────────
function addNote() {
  const title = document.getElementById('note-title').value.trim();
  const body  = document.getElementById('note-body').value.trim();
  const subj  = document.getElementById('note-subject').value;
  const tag   = document.getElementById('note-tag').value;
  if (!title || !body) { toast('Fill title & note body', 'error'); return; }
  notes.unshift({ title, body, subj, tag, id: Date.now(), date: new Date().toLocaleDateString() });
  save();
  document.getElementById('note-title').value = '';
  document.getElementById('note-body').value  = '';
  renderNotes(); refreshOverview();
  toast('Note saved', 'success');
}
function deleteNote(id) {
  notes = notes.filter(n=>n.id!==id); save();
  renderNotes(); refreshOverview(); toast('Note deleted','info');
}
function renderNotes() {
  const q = (document.getElementById('notes-search')?.value || '').toLowerCase();
  const grid = document.getElementById('notes-grid');
  if (!grid) return;
  let filtered = notes;
  if (q) filtered = notes.filter(n => n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q));
  if (!filtered.length) { grid.innerHTML = '<p style="color:var(--text3);font-size:.82rem">No notes found.</p>'; return; }
  grid.innerHTML = filtered.map(n => `
    <div class="note-card">
      <div class="note-card-header">
        <span class="note-title">${n.title}</span>
        <span class="note-tag ${n.tag}">${n.tag}</span>
      </div>
      ${n.subj ? `<div style="font-size:.7rem;color:var(--text3);margin-bottom:.35rem">${n.subj}</div>` : ''}
      <div class="note-body">${n.body}</div>
      <div class="note-footer">
        <span>${n.date}</span>
        <button class="note-del" onclick="deleteNote(${n.id})">\uD83D\uDDD1\uFE0F Delete</button>
      </div>
    </div>`).join('');
}

// ── OVERVIEW ─────────────────────────────────────────────
function setRing(id, pct) {
  const el = document.getElementById(id);
  if (el) el.setAttribute('stroke-dasharray', `${Math.min(100,pct)} 100`);
}
function refreshOverview() {
  const gpa = calcGPA();
  document.getElementById('ov-gpa').textContent = gpa ?? '--';
  setRing('ov-gpa-ring', gpa ? parseFloat(gpa)/10*100 : 0);

  const attAvg = attendance.length
    ? Math.round(attendance.reduce((s,a)=>s+a.pres/a.tot*100,0)/attendance.length) : null;
  document.getElementById('ov-att').textContent = attAvg!=null ? attAvg+'%' : '--%';
  setRing('ov-att-ring', attAvg ?? 0);

  const done = todos.filter(t=>t.done).length;
  document.getElementById('ov-tasks').textContent = `${done}/${todos.length}`;
  setRing('ov-tasks-ring', todos.length ? Math.round(done/todos.length*100) : 0);

  const uniq = new Set(grades.map(g=>g.sub)).size;
  document.getElementById('ov-subjects').textContent = uniq;
  setRing('ov-sub-ring', Math.min(100, uniq*10));

  const hrs = Math.floor(studyMins/60);
  document.getElementById('ov-hours').textContent = hrs + 'h';
  setRing('ov-hours-ring', Math.min(100, hrs/10*100));

  document.getElementById('ov-notes').textContent = notes.length;
  setRing('ov-notes-ring', Math.min(100, notes.length*10));

  // GPA bar
  destroyChart('gpaLine');
  const ctx1 = document.getElementById('gpaLineChart').getContext('2d');
  chartRefs.gpaLine = new Chart(ctx1, {
    type:'bar',
    data:{
      labels: grades.length ? grades.map(g=>g.sub) : ['No data'],
      datasets:[{ label:'Grade Points', data: grades.length ? grades.map(g=>g.pts) : [0],
        backgroundColor:'rgba(99,102,241,.3)', borderColor:'#6366f1', borderWidth:2,
        borderRadius:6, borderSkipped:false }]
    },
    options:{ responsive:true,
      plugins:{legend:{labels:{color:tickColor()}}},
      scales:{ y:{min:0,max:10,grid:{color:gridColor()},ticks:{color:tickColor()}}, x:{grid:{display:false},ticks:{color:tickColor()}} } }
  });

  // Attendance donut
  destroyChart('attDonut');
  const ctx2 = document.getElementById('attDonut').getContext('2d');
  const present = attendance.reduce((s,a)=>s+a.pres,0);
  const absent  = attendance.reduce((s,a)=>s+(a.tot-a.pres),0);
  chartRefs.attDonut = new Chart(ctx2, {
    type:'doughnut',
    data:{ labels:['Present','Absent'],
      datasets:[{ data:present+absent?[present,absent]:[1,0],
        backgroundColor:['rgba(16,185,129,.8)','rgba(244,63,94,.6)'], borderWidth:0, hoverOffset:6 }] },
    options:{ responsive:true, cutout:'70%',
      plugins:{ legend:{ position:'bottom', labels:{ color:tickColor(), padding:12, boxWidth:10 } } } }
  });
}

function rebuildCharts() {
  const tab = document.querySelector('.tab-panel.active')?.id?.replace('tab-','');
  if (tab==='overview')   refreshOverview();
  if (tab==='gpa')        renderGpaBar();
  if (tab==='attendance') renderAttBar();
  if (tab==='analytics')  renderAnalytics();
}

// ── Boot ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  startClock();
  initSidebar();
  initTheme();
  initTodoFilters();
  initStreak();
  initTimer();
  showQuote();
  populateNoteSubjectSelect();
  refreshOverview();
  toast('Welcome back! \uD83D\uDC4B', 'info');
});
