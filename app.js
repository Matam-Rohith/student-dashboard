// ===================== STORAGE HELPERS =====================
const save = (key, val) => localStorage.setItem(key, JSON.stringify(val));
const load = (key, def) => { try { return JSON.parse(localStorage.getItem(key)) || def; } catch { return def; } };

// ===================== NAVIGATION =====================
function showTab(tab) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');
  const btns = document.querySelectorAll('.nav-btn');
  const map = { gpa: 0, attendance: 1, timetable: 2 };
  btns[map[tab]].classList.add('active');
}

function clearAllData() {
  if (confirm('Are you sure? This will delete ALL your data.')) {
    localStorage.clear();
    subjects = []; renderSubjects();
    attendance = []; renderAttendance();
    timetable = {}; renderTimetable();
  }
}

// ===================== GPA CALCULATOR =====================
let subjects = load('gpa_subjects', []);

const gradeMap = { '10': 'O', '9': 'A+', '8': 'A', '7': 'B+', '6': 'B', '5': 'C', '0': 'F' };
const badgeMap = { '10': 'badge-o', '9': 'badge-o', '8': 'badge-a', '7': 'badge-a', '6': 'badge-b', '5': 'badge-b', '0': 'badge-f' };

function addSubject() {
  const name = document.getElementById('subjectName').value.trim();
  const credits = parseInt(document.getElementById('subjectCredits').value);
  const grade = document.getElementById('subjectGrade').value;
  if (!name || !credits || credits < 1) return alert('Please fill in subject name and valid credits.');
  subjects.push({ id: Date.now(), name, credits, grade });
  save('gpa_subjects', subjects);
  document.getElementById('subjectName').value = '';
  document.getElementById('subjectCredits').value = '';
  renderSubjects();
}

function deleteSubject(id) {
  subjects = subjects.filter(s => s.id !== id);
  save('gpa_subjects', subjects);
  renderSubjects();
}

function calcGPA() {
  if (!subjects.length) return 0;
  const totalCP = subjects.reduce((a, s) => a + s.credits * parseFloat(s.grade), 0);
  const totalC = subjects.reduce((a, s) => a + s.credits, 0);
  return totalC ? (totalCP / totalC).toFixed(2) : '0.00';
}

function gpaToLetter(gpa) {
  if (gpa >= 9) return 'O';
  if (gpa >= 8) return 'A+';
  if (gpa >= 7) return 'A';
  if (gpa >= 6) return 'B+';
  if (gpa >= 5) return 'B';
  if (gpa >= 4) return 'C';
  return 'F';
}

function renderSubjects() {
  const tbody = document.getElementById('subjectsBody');
  const noMsg = document.getElementById('noSubjects');
  const table = document.getElementById('subjectsTable');
  tbody.innerHTML = '';
  if (!subjects.length) { noMsg.style.display = 'block'; table.style.display = 'none'; return; }
  noMsg.style.display = 'none'; table.style.display = 'table';
  subjects.forEach(s => {
    const tr = document.createElement('tr');
    const gp = (parseFloat(s.grade) * s.credits).toFixed(1);
    tr.innerHTML = `
      <td><b>${s.name}</b></td>
      <td>${s.credits}</td>
      <td><span class="badge ${badgeMap[s.grade]}">${gradeMap[s.grade]}</span></td>
      <td>${gp}</td>
      <td><button class="btn-del" onclick="deleteSubject(${s.id})"><i class="fas fa-trash"></i></button></td>
    `;
    tbody.appendChild(tr);
  });
  const gpa = calcGPA();
  document.getElementById('currentGPA').textContent = gpa;
  document.getElementById('gradeLetter').textContent = subjects.length ? gpaToLetter(parseFloat(gpa)) : 'N/A';
  document.getElementById('totalSubjects').textContent = subjects.length;
  document.getElementById('totalCredits').textContent = subjects.reduce((a, s) => a + s.credits, 0);
}

// ===================== ATTENDANCE TRACKER =====================
let attendance = load('attendance', []);

function addAttendance() {
  const subject = document.getElementById('attSubject').value.trim();
  const total = parseInt(document.getElementById('attTotal').value);
  const present = parseInt(document.getElementById('attPresent').value);
  if (!subject || isNaN(total) || isNaN(present)) return alert('Please fill all attendance fields.');
  if (present > total) return alert('Attended classes cannot exceed total classes.');
  const existing = attendance.findIndex(a => a.subject.toLowerCase() === subject.toLowerCase());
  if (existing >= 0) {
    attendance[existing] = { ...attendance[existing], total, present };
  } else {
    attendance.push({ id: Date.now(), subject, total, present });
  }
  save('attendance', attendance);
  document.getElementById('attSubject').value = '';
  document.getElementById('attTotal').value = '';
  document.getElementById('attPresent').value = '';
  renderAttendance();
}

function deleteAttendance(id) {
  attendance = attendance.filter(a => a.id !== id);
  save('attendance', attendance);
  renderAttendance();
}

function classesNeeded(present, total) {
  // How many consecutive classes needed to reach 75%
  if ((present / total) >= 0.75) return null;
  let extra = 0;
  while (((present + extra) / (total + extra)) < 0.75) extra++;
  return extra;
}

function renderAttendance() {
  const list = document.getElementById('attendanceList');
  const noMsg = document.getElementById('noAttendance');
  list.innerHTML = '';
  if (!attendance.length) { noMsg.style.display = 'block'; updateAttSummary(); return; }
  noMsg.style.display = 'none';
  attendance.forEach(a => {
    const pct = a.total ? Math.round((a.present / a.total) * 100) : 0;
    const cls = pct >= 75 ? 'att-safe' : pct >= 60 ? 'att-warn' : 'att-risk';
    const needed = classesNeeded(a.present, a.total);
    const needStr = needed ? `<div class="classes-needed">Need ${needed} more class(es) to reach 75%</div>` : '';
    const div = document.createElement('div');
    div.className = `att-item ${cls}`;
    div.innerHTML = `
      <div>
        <div class="att-subject">${a.subject}</div>
        <div class="att-stats">${a.present} / ${a.total} classes</div>
        ${needStr}
      </div>
      <div class="att-bar-wrap"><div class="att-bar" style="width:${pct}%"></div></div>
      <div class="att-percent">${pct}%</div>
      <button class="att-del" onclick="deleteAttendance(${a.id})"><i class="fas fa-times"></i></button>
    `;
    list.appendChild(div);
  });
  updateAttSummary();
}

function updateAttSummary() {
  const totalPresent = attendance.reduce((a, s) => a + s.present, 0);
  const totalClasses = attendance.reduce((a, s) => a + s.total, 0);
  const overall = totalClasses ? Math.round((totalPresent / totalClasses) * 100) : 0;
  const safe = attendance.filter(a => a.total && (a.present / a.total) >= 0.75).length;
  const risk = attendance.filter(a => a.total && (a.present / a.total) < 0.75).length;
  document.getElementById('overallAtt').textContent = overall + '%';
  document.getElementById('safeCount').textContent = safe;
  document.getElementById('riskCount').textContent = risk;
  const card = document.getElementById('attOverallCard');
  card.style.background = overall >= 75 ? 'linear-gradient(135deg,#22c55e,#16a34a)' : 'linear-gradient(135deg,#ef4444,#dc2626)';
  card.querySelector('.value').style.color = '#fff';
  card.querySelector('.label').style.color = 'rgba(255,255,255,0.8)';
}

// ===================== TIMETABLE MANAGER =====================
let timetable = load('timetable', {});
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function addTimetableEntry() {
  const day = document.getElementById('ttDay').value;
  const subject = document.getElementById('ttSubject').value.trim();
  const start = document.getElementById('ttStart').value;
  const end = document.getElementById('ttEnd').value;
  const room = document.getElementById('ttRoom').value.trim();
  if (!subject || !start || !end) return alert('Please fill Subject, Start Time, and End Time.');
  if (!timetable[day]) timetable[day] = [];
  timetable[day].push({ id: Date.now(), subject, start, end, room });
  timetable[day].sort((a, b) => a.start.localeCompare(b.start));
  save('timetable', timetable);
  document.getElementById('ttSubject').value = '';
  document.getElementById('ttStart').value = '';
  document.getElementById('ttEnd').value = '';
  document.getElementById('ttRoom').value = '';
  renderTimetable();
}

function deleteTTEntry(day, id) {
  timetable[day] = timetable[day].filter(e => e.id !== id);
  save('timetable', timetable);
  renderTimetable();
}

function fmt12(t) {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hr = parseInt(h);
  return (hr % 12 || 12) + ':' + m + (hr >= 12 ? ' PM' : ' AM');
}

function renderTimetable() {
  const grid = document.getElementById('timetableGrid');
  const noMsg = document.getElementById('noTimetable');
  grid.innerHTML = '';
  const hasAny = DAYS.some(d => timetable[d] && timetable[d].length);
  if (!hasAny) { noMsg.style.display = 'block'; return; }
  noMsg.style.display = 'none';
  DAYS.forEach(day => {
    const entries = timetable[day] || [];
    const col = document.createElement('div');
    col.className = 'tt-day-col';
    col.innerHTML = `<div class="tt-day-title">${day}</div>`;
    if (!entries.length) {
      col.innerHTML += `<div class="tt-empty">No classes</div>`;
    } else {
      entries.forEach(e => {
        col.innerHTML += `
          <div class="tt-entry">
            <button class="tt-del" onclick="deleteTTEntry('${day}',${e.id})"><i class="fas fa-times"></i></button>
            <div class="tt-entry-subject">${e.subject}</div>
            <div class="tt-entry-time">${fmt12(e.start)} – ${fmt12(e.end)}</div>
            ${e.room ? `<div class="tt-entry-room"><i class="fas fa-map-marker-alt"></i> ${e.room}</div>` : ''}
          </div>
        `;
      });
    }
    grid.appendChild(col);
  });
}

// ===================== INIT =====================
renderSubjects();
renderAttendance();
renderTimetable();
