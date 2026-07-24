"use strict";

const APP_VERSION = "0.4";
const STORAGE_PREFIX = "phoenix.";
const $ = (id) => document.getElementById(id);
const today = () => new Date().toISOString().slice(0, 10);

const defaultTasks = [
  { id: "existence", title: "Eine Existenzaufgabe erledigen", note: "Jobcenter, AOK, Schuldnerberatung oder Wohnen", points: 30 },
  { id: "cannabis", title: "Cannabisfrei bleiben", note: "Ehrlich dokumentieren statt perfekt wirken", points: 25 },
  { id: "sport", title: "Sport oder 30 Minuten Bewegung", note: "Kampfsport, Training oder Spaziergang", points: 20 },
  { id: "water", title: "Mindestens 2 Liter Wasser", note: "Grundversorgung vor Optimierung", points: 10 },
  { id: "daily", title: "Daily Check-in speichern", note: "Auch an schwierigen Tagen", points: 15 }
];

const defaultMissions = [
  { name: "Existenz sichern", next: "Nächsten Behördenkontakt konkret festlegen", progress: 10 },
  { name: "Finanzen ordnen", next: "Vollständige Gläubigerliste erstellen", progress: 5 },
  { name: "Lehrer werden", next: "Ersten pädagogischen Einstieg auswählen", progress: 10 },
  { name: "Gesundheit stärken", next: "Sieben Tage Schlaf, Sport und Konsum erfassen", progress: 10 }
];

function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch (error) {
    console.error("Lesefehler", key, error);
    notify("Gespeicherte Daten konnten nicht gelesen werden.", true);
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error("Speicherfehler", key, error);
    notify("Speichern fehlgeschlagen. Prüfe den freien Browserspeicher.", true);
    return false;
  }
}

function notify(message, isError = false) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.toggle("error", isError);
  toast.classList.add("show");
  clearTimeout(notify.timer);
  notify.timer = setTimeout(() => toast.classList.remove("show"), 2800);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[char]);
}

function makeId() {
  return `task-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getTasks() {
  const stored = readStorage("taskDefinitions", null);
  if (!Array.isArray(stored) || stored.length === 0) return structuredClone(defaultTasks);
  return stored.filter((task) => task && task.id && task.title).map((task) => ({
    id: String(task.id), title: String(task.title), note: String(task.note || ""), points: Math.max(1, Math.min(100, Number(task.points) || 1))
  }));
}

function taskState() {
  return readStorage(`tasks.${today()}`, {});
}

function entries() {
  const data = readStorage("entries", []);
  return Array.isArray(data) ? data : [];
}

function renderTasks() {
  const box = $("taskList");
  const state = taskState();
  const tasks = getTasks();
  box.innerHTML = "";
  tasks.forEach((task) => {
    const label = document.createElement("label");
    label.className = "task";
    label.innerHTML = `<input type="checkbox" data-id="${escapeHtml(task.id)}" ${state[task.id] ? "checked" : ""}><span><strong>${escapeHtml(task.title)} · ${task.points} P</strong><small>${escapeHtml(task.note)}</small></span>`;
    box.appendChild(label);
  });
  box.querySelectorAll("input").forEach((input) => input.addEventListener("change", () => {
    const current = taskState();
    current[input.dataset.id] = input.checked;
    if (writeStorage(`tasks.${today()}`, current)) updateDashboard();
  }));
}

function renderTaskEditor() {
  const box = $("taskEditorList");
  box.innerHTML = "";
  getTasks().forEach((task) => addTaskEditorRow(task));
}

function addTaskEditorRow(task = { id: makeId(), title: "", note: "", points: 10 }) {
  const row = document.createElement("div");
  row.className = "task-editor";
  row.dataset.id = task.id;
  row.innerHTML = `<div class="task-editor-grid"><div><label>Titel</label><input class="task-title" type="text" maxlength="80" value="${escapeHtml(task.title)}"><label>Hinweis</label><input class="task-note" type="text" maxlength="120" value="${escapeHtml(task.note)}"></div><div><label>Punkte</label><input class="task-points" type="number" min="1" max="100" value="${task.points}"></div></div><div class="task-editor-actions"><button class="remove-task" type="button">Löschen</button></div>`;
  row.querySelector(".remove-task").addEventListener("click", () => {
    if (document.querySelectorAll(".task-editor").length <= 1) return notify("Mindestens eine Aufgabe muss bleiben.", true);
    row.remove();
  });
  $("taskEditorList").appendChild(row);
}

function saveTasks() {
  const rows = [...document.querySelectorAll(".task-editor")];
  const tasks = rows.map((row) => ({
    id: row.dataset.id || makeId(),
    title: row.querySelector(".task-title").value.trim(),
    note: row.querySelector(".task-note").value.trim(),
    points: Number(row.querySelector(".task-points").value)
  }));
  if (tasks.some((task) => !task.title)) return notify("Jede Aufgabe braucht einen Titel.", true);
  if (tasks.some((task) => !Number.isFinite(task.points) || task.points < 1 || task.points > 100)) return notify("Punkte müssen zwischen 1 und 100 liegen.", true);
  const total = tasks.reduce((sum, task) => sum + task.points, 0);
  if (total > 100) return notify(`Gesamtpunkte sind ${total}. Maximal erlaubt sind 100.`, true);
  if (writeStorage("taskDefinitions", tasks)) {
    renderTasks();
    updateDashboard();
    notify("Aufgaben gespeichert.");
    showView("today");
  }
}

function score() {
  const state = taskState();
  return Math.min(100, getTasks().reduce((sum, task) => sum + (state[task.id] ? task.points : 0), 0));
}

function average(values) {
  const nums = values.map(Number).filter(Number.isFinite);
  return nums.length ? (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(1) : "–";
}

function streak(list) {
  const dates = new Set(list.filter((x) => x.cannabisFree).map((x) => x.date));
  let count = 0;
  const cursor = new Date();
  for (let i = 0; i < 365; i += 1) {
    if (!dates.has(cursor.toISOString().slice(0, 10))) break;
    count += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
}

function updateDashboard() {
  const currentScore = score();
  const state = taskState();
  const tasks = getTasks();
  const list = entries();
  $("scoreValue").textContent = currentScore;
  $("scoreRing").style.setProperty("--score", currentScore);
  $("taskCounter").textContent = `${tasks.filter((task) => state[task.id]).length}/${tasks.length}`;
  $("streakValue").textContent = streak(list);
  $("checkinValue").textContent = list.length;
  $("moodValue").textContent = average(list.map((x) => x.mood));
  $("sportValue").textContent = list.filter((x) => x.sportDone).length;
  const open = tasks.filter((task) => !state[task.id]).sort((a, b) => b.points - a.points);
  $("priorityTitle").textContent = open[0]?.title || "Tag abgeschlossen";
  $("priorityReason").textContent = open[0] ? `Höchster offener Hebel: ${open[0].points} Punkte.` : "Alle Tagesmissionen sind erledigt.";
  renderReview();
}

function saveCheckin() {
  const sleepValue = $("sleep").value;
  const sleep = sleepValue === "" ? null : Number(sleepValue);
  if (sleep !== null && (!Number.isFinite(sleep) || sleep < 0 || sleep > 16)) return notify("Schlaf muss zwischen 0 und 16 Stunden liegen.", true);
  const entry = { date: today(), savedAt: new Date().toISOString(), mood: Number($("mood").value), energy: Number($("energy").value), sleep, cannabisFree: $("cannabisFree").checked, sportDone: $("sportDone").checked, waterDone: $("waterDone").checked, win: $("win").value.trim(), blocker: $("blocker").value.trim(), tomorrow: $("tomorrow").value.trim() };
  const list = entries().filter((x) => x.date !== entry.date);
  list.push(entry);
  list.sort((a, b) => a.date.localeCompare(b.date));
  if (!writeStorage("entries", list)) return;
  const state = taskState();
  const taskIds = new Set(getTasks().map((task) => task.id));
  if (taskIds.has("daily")) state.daily = true;
  if (taskIds.has("cannabis")) state.cannabis = entry.cannabisFree;
  if (taskIds.has("sport")) state.sport = entry.sportDone;
  if (taskIds.has("water")) state.water = entry.waterDone;
  writeStorage(`tasks.${today()}`, state);
  renderTasks(); updateDashboard(); notify("Check-in gespeichert.");
}

function loadTodayEntry() {
  const entry = entries().find((x) => x.date === today());
  if (!entry) return;
  $("mood").value = entry.mood; $("energy").value = entry.energy; $("sleep").value = entry.sleep ?? "";
  $("cannabisFree").checked = Boolean(entry.cannabisFree); $("sportDone").checked = Boolean(entry.sportDone); $("waterDone").checked = Boolean(entry.waterDone);
  $("win").value = entry.win || ""; $("blocker").value = entry.blocker || ""; $("tomorrow").value = entry.tomorrow || ""; syncRanges();
}

function syncRanges() { $("moodLabel").textContent = $("mood").value; $("energyLabel").textContent = $("energy").value; }

function renderMissions() {
  const missions = readStorage("missions", defaultMissions);
  const safe = Array.isArray(missions) ? missions : defaultMissions;
  $("missionList").innerHTML = safe.map((mission, index) => `<div class="mission"><label>Mission</label><input type="text" data-field="name" data-index="${index}" value="${escapeHtml(mission.name)}"><label>Nächster Schritt</label><input type="text" data-field="next" data-index="${index}" value="${escapeHtml(mission.next)}"><label>Fortschritt: <strong>${Number(mission.progress) || 0}</strong>%</label><input type="range" min="0" max="100" data-field="progress" data-index="${index}" value="${Number(mission.progress) || 0}"></div>`).join("");
  document.querySelectorAll('.mission input[type="range"]').forEach((range) => range.addEventListener("input", () => { range.previousElementSibling.querySelector("strong").textContent = range.value; }));
}

function saveMissions() {
  const missions = [...document.querySelectorAll(".mission")].map((el) => ({ name: el.querySelector('[data-field="name"]').value.trim(), next: el.querySelector('[data-field="next"]').value.trim(), progress: Number(el.querySelector('[data-field="progress"]').value) }));
  if (writeStorage("missions", missions)) notify("Missionen gespeichert.");
}

function renderReview() {
  const recent = entries().slice(-7);
  $("reviewMood").textContent = average(recent.map((x) => x.mood)); $("reviewEnergy").textContent = average(recent.map((x) => x.energy));
  $("reviewSport").textContent = recent.filter((x) => x.sportDone).length; $("reviewCannabis").textContent = recent.filter((x) => x.cannabisFree).length;
  const box = $("history");
  if (!recent.length) { box.innerHTML = '<p class="muted">Noch keine Check-ins gespeichert.</p>'; return; }
  box.innerHTML = [...recent].reverse().map((entry) => `<div class="history-item"><strong>${new Date(entry.date + "T12:00:00").toLocaleDateString("de-DE")}</strong><small>Stimmung ${entry.mood}/10 · Energie ${entry.energy}/10 · ${entry.sportDone ? "Sport ✓" : "kein Sport"} · ${entry.cannabisFree ? "cannabisfrei ✓" : "Konsum dokumentiert"}</small>${entry.win ? `<small>Erfolg: ${escapeHtml(entry.win)}</small>` : ""}</div>`).join("");
}

function exportData() {
  const data = { app: "PHOENIX", version: APP_VERSION, exportedAt: new Date().toISOString(), entries: entries(), missions: readStorage("missions", defaultMissions), taskDefinitions: getTasks() };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `PHOENIX_Backup_${today()}.json`; link.click(); setTimeout(() => URL.revokeObjectURL(link.href), 500); notify("Backup exportiert.");
}

function importData(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (data.app !== "PHOENIX") throw new Error("Ungültige App-Kennung");
      if (Array.isArray(data.entries)) writeStorage("entries", data.entries);
      if (Array.isArray(data.missions)) writeStorage("missions", data.missions);
      if (Array.isArray(data.taskDefinitions)) writeStorage("taskDefinitions", data.taskDefinitions);
      renderMissions(); renderTaskEditor(); renderTasks(); loadTodayEntry(); updateDashboard(); notify("Daten erfolgreich importiert.");
    } catch (error) { console.error(error); notify("Import fehlgeschlagen: ungültige PHÖNIX-Datei.", true); }
  };
  reader.onerror = () => notify("Datei konnte nicht gelesen werden.", true);
  reader.readAsText(file);
}

function showView(name) {
  document.querySelectorAll(".view").forEach((view) => view.classList.toggle("active", view.dataset.view === name));
  document.querySelectorAll(".bottom-nav button").forEach((button) => button.classList.toggle("active", button.dataset.target === name));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.querySelectorAll(".bottom-nav button").forEach((button) => button.addEventListener("click", () => showView(button.dataset.target)));
document.querySelectorAll("[data-go]").forEach((button) => button.addEventListener("click", () => showView(button.dataset.go)));
$("openTaskEditor").addEventListener("click", () => { renderTaskEditor(); showView("tasks"); });
$("addTask").addEventListener("click", () => addTaskEditorRow());
$("saveTasks").addEventListener("click", saveTasks);
$("mood").addEventListener("input", syncRanges); $("energy").addEventListener("input", syncRanges);
$("saveCheckin").addEventListener("click", saveCheckin); $("saveMissions").addEventListener("click", saveMissions); $("exportData").addEventListener("click", exportData);
$("importData").addEventListener("change", (event) => { if (event.target.files[0]) importData(event.target.files[0]); event.target.value = ""; });
$("resetData").addEventListener("click", () => { if (confirm("Wirklich alle PHÖNIX-Daten auf diesem Gerät löschen?")) { Object.keys(localStorage).filter((key) => key.startsWith(STORAGE_PREFIX)).forEach((key) => localStorage.removeItem(key)); location.reload(); } });

if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("./service-worker.js").catch((error) => console.warn("Service Worker", error)));

syncRanges(); renderTasks(); renderTaskEditor(); renderMissions(); loadTodayEntry(); updateDashboard();
