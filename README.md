# 🎓 Student Dashboard

A clean, fully client-side **Student Dashboard** built with HTML, CSS, and Vanilla JavaScript. All data is stored in the browser using `localStorage` — no backend or database required.

## 🚀 Live Demo
> Open `index.html` directly in your browser — no build steps needed!

## ✨ Features

### 📊 GPA Calculator
- Add subjects with credits and grades (10-point scale: O, A+, A, B+, B, C, F)
- Automatically calculates **Cumulative GPA** and **Grade Letter**
- Displays total subjects and total credits
- Delete individual subjects

### 📅 Attendance Tracker
- Add/update attendance per subject (present / total classes)
- Color-coded progress bars: 🟢 Safe (≥75%) | 🟡 Warning (60–74%) | 🔴 Risk (<60%)
- Shows **classes needed to reach 75%** for at-risk subjects
- Overall attendance summary card

### 🕐 Timetable Manager
- Add classes with day, subject, start/end time, and room
- Auto-sorted by time per day
- Weekly grid view (Mon–Sat)
- 12-hour time format display

## 💾 Storage
All data is saved automatically in **`localStorage`** — data persists across browser sessions without any server.

## 🛠️ Tech Stack
- HTML5, CSS3, Vanilla JavaScript
- Google Fonts (Inter)
- Font Awesome Icons
- Browser `localStorage` API

## 📁 File Structure
```
student-dashboard/
├── index.html   # Main app structure
├── style.css    # All styling
├── app.js       # All logic (GPA, Attendance, Timetable)
└── README.md
```

## 🧑‍💻 Author
**Matam Rohith** — [GitHub Profile](https://github.com/Matam-Rohith)
