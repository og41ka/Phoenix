
"use strict";

const $ = (id) => document.getElementById(id);
const today = () => new Date().toISOString().slice(0,10);
const get = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
};
const set = (key, value) => localStorage.setItem(key, JSON.stringify(value));

const tasks = [
  {id:"existence", title:"Eine Existenzaufgabe erledigen", note:"Jobcenter, AOK, Schuldnerberatung oder Wohnen", points:30},
  {id:"cannabis", title:"Cannabisfrei bleiben", note:"Ehrlich dokumentieren statt perfekt wirken", points:25},
  {id:"sport", title:"Sport oder 30 Minuten Bewegung", note:"Kampfsport, Training oder Spaziergang", points:20},
  {id:"water", title:"Mindestens 2 Liter Wasser", note:"Grundversorgung vor Optimierung", points:10},
  {id:"daily", title:"Daily Check-in speichern", note:"Auch an schwierigen Tagen", points:15}
];

const defaultMissions = [
  {name:"Existenz sichern", next:"Nächsten Behördenkontakt konkret festlegen", progress:10},
  {name:"Finanzen ordnen", next:"Vollständige Gläubigerliste erstellen", progress:5},
  {name:"Lehrer werden", next:"Ersten pädagogischen Einstieg auswählen", progress:10},
  {name:"Gesundheit stärken", next:"Sieben Tage Schlaf, Sport und Konsum erfassen", progress:10}
];

function taskState(){ return get("phoenix.tasks."+today(), {}); }

function renderTasks(){
  const box = $("taskList");
  const state = taskState();
  box.innerHTML = "";
  tasks.forEach(task => {
    const label = document.createElement("label");
    label.className = "task";
    label.innerHTML = `
      <input type="checkbox" data-id="${task.id}" ${state[task.id] ? "checked" : ""}>
      <span><strong>${task.title} · ${task.points} P</strong><small>${task.note}</small></span>`;
    box.appendChild(label);
  });
  box.querySelectorAll("input").forEach(input => {
    input.addEventListener("change", () => {
      const state = taskState();
      state[input.dataset.id] = input.checked;
      set("phoenix.tasks."+today(), state);
      updateDashboard();
    });
  });
}

function score(){
  const state = taskState();
  return tasks.reduce((sum,t) => sum + (state[t.id] ? t.points : 0), 0);
}

function entries(){ return get("phoenix.entries", []); }

function average(values){
  if(!values.length) return "–";
  return (values.reduce((a,b)=>a+Number(b),0)/values.length).toFixed(1);
}

function streak(list){
  const dates = new Set(list.filter(x=>x.cannabisFree).map(x=>x.date));
  let count = 0;
  const cursor = new Date();
  for(let i=0;i<365;i++){
    const key = cursor.toISOString().slice(0,10);
    if(!dates.has(key)) break;
    count++;
    cursor.setDate(cursor.getDate()-1);
  }
  return count;
}

function updatePriority(currentScore){
  const state = taskState();
  const open = tasks.filter(t=>!state[t.id]).sort((a,b)=>b.points-a.points);
  if(open.length){
    $("priorityTitle").textContent = open[0].title;
    $("priorityReason").textContent = `Höchster offener Hebel: ${open[0].points} Punkte.`;
  }else{
    $("priorityTitle").textContent = "Tag abgeschlossen";
    $("priorityReason").textContent = "Alle Tagesmissionen sind erledigt. Jetzt regenerieren.";
  }
}

function updateDashboard(){
  const currentScore = score();
  const state = taskState();
  const list = entries();
  $("scoreValue").textContent = currentScore;
  $("scoreRing").style.setProperty("--score", currentScore);
  $("taskCounter").textContent = `${tasks.filter(t=>state[t.id]).length}/${tasks.length}`;
  $("streakValue").textContent = streak(list);
  $("checkinValue").textContent = list.length;
  $("moodValue").textContent = average(list.map(x=>x.mood));
  $("sportValue").textContent = list.filter(x=>x.sportDone).length;
  updatePriority(currentScore);
  renderReview();
}

function saveCheckin(){
  const entry = {
    date: today(),
    savedAt: new Date().toISOString(),
    mood: Number($("mood").value),
    energy: Number($("energy").value),
    sleep: $("sleep").value ? Number($("sleep").value) : null,
    cannabisFree: $("cannabisFree").checked,
    sportDone: $("sportDone").checked,
    waterDone: $("waterDone").checked,
    win: $("win").value.trim(),
    blocker: $("blocker").value.trim(),
    tomorrow: $("tomorrow").value.trim()
  };

  const list = entries().filter(x=>x.date !== entry.date);
  list.push(entry);
  list.sort((a,b)=>a.date.localeCompare(b.date));
  set("phoenix.entries", list);

  const state = taskState();
  state.daily = true;
  state.cannabis = entry.cannabisFree;
  state.sport = entry.sportDone;
  state.water = entry.waterDone;
  set("phoenix.tasks."+today(), state);

  $("saveStatus").textContent = "Gespeichert – nur lokal auf diesem Gerät.";
  renderTasks();
  updateDashboard();
}

function loadTodayEntry(){
  const entry = entries().find(x=>x.date===today());
  if(!entry) return;
  $("mood").value = entry.mood;
  $("energy").value = entry.energy;
  $("sleep").value = entry.sleep ?? "";
  $("cannabisFree").checked = entry.cannabisFree;
  $("sportDone").checked = entry.sportDone;
  $("waterDone").checked = entry.waterDone;
  $("win").value = entry.win;
  $("blocker").value = entry.blocker;
  $("tomorrow").value = entry.tomorrow;
  syncRanges();
}

function syncRanges(){
  $("moodLabel").textContent = $("mood").value;
  $("energyLabel").textContent = $("energy").value;
}

function renderMissions(){
  const missions = get("phoenix.missions", defaultMissions);
  const box = $("missionList");
  box.innerHTML = "";
  missions.forEach((mission,index)=>{
    const el = document.createElement("div");
    el.className = "mission";
    el.innerHTML = `
      <label>Mission</label>
      <input type="text" data-field="name" data-index="${index}" value="${escapeHtml(mission.name)}">
      <label>Nächster Schritt</label>
      <input type="text" data-field="next" data-index="${index}" value="${escapeHtml(mission.next)}">
      <label>Fortschritt: <strong>${mission.progress}</strong>%</label>
      <input type="range" min="0" max="100" data-field="progress" data-index="${index}" value="${mission.progress}">`;
    box.appendChild(el);
  });
  box.querySelectorAll('input[type="range"]').forEach(r=>{
    r.addEventListener("input",()=>r.previousElementSibling.querySelector("strong").textContent=r.value);
  });
}

function saveMissions(){
  const missions = [...document.querySelectorAll(".mission")].map(el=>({
    name: el.querySelector('[data-field="name"]').value.trim(),
    next: el.querySelector('[data-field="next"]').value.trim(),
    progress: Number(el.querySelector('[data-field="progress"]').value)
  }));
  set("phoenix.missions", missions);
  alert("Missionen gespeichert.");
}

function renderReview(){
  const recent = entries().slice(-7);
  $("reviewMood").textContent = average(recent.map(x=>x.mood));
  $("reviewEnergy").textContent = average(recent.map(x=>x.energy));
  $("reviewSport").textContent = recent.filter(x=>x.sportDone).length;
  $("reviewCannabis").textContent = recent.filter(x=>x.cannabisFree).length;

  const box = $("history");
  box.innerHTML = "";
  [...recent].reverse().forEach(entry=>{
    const item = document.createElement("div");
    item.className = "history-item";
    item.innerHTML = `
      <strong>${new Date(entry.date+"T12:00:00").toLocaleDateString("de-DE")}</strong>
      <small>Stimmung ${entry.mood}/10 · Energie ${entry.energy}/10 · ${entry.sportDone ? "Sport ✓" : "kein Sport"} · ${entry.cannabisFree ? "cannabisfrei ✓" : "Konsum dokumentiert"}</small>
      ${entry.win ? `<small>Erfolg: ${escapeHtml(entry.win)}</small>` : ""}`;
    box.appendChild(item);
  });
  if(!recent.length) box.innerHTML = '<p class="muted">Noch keine Check-ins gespeichert.</p>';
}

function escapeHtml(value){
  return String(value).replace(/[&<>"']/g, char=>({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  })[char]);
}

function exportData(){
  const data = {
    app:"PHOENIX",
    version:"0.3",
    exportedAt:new Date().toISOString(),
    entries:entries(),
    missions:get("phoenix.missions", defaultMissions)
  };
  const blob = new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `PHOENIX_Backup_${today()}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function importData(file){
  const reader = new FileReader();
  reader.onload = () => {
    try{
      const data = JSON.parse(reader.result);
      if(Array.isArray(data.entries)) set("phoenix.entries", data.entries);
      if(Array.isArray(data.missions)) set("phoenix.missions", data.missions);
      renderMissions();
      updateDashboard();
      alert("Daten erfolgreich importiert.");
    }catch{
      alert("Die Datei konnte nicht gelesen werden.");
    }
  };
  reader.readAsText(file);
}

document.querySelectorAll(".bottom-nav button").forEach(button=>{
  button.addEventListener("click",()=>{
    document.querySelectorAll(".bottom-nav button").forEach(x=>x.classList.remove("active"));
    document.querySelectorAll(".view").forEach(x=>x.classList.remove("active"));
    button.classList.add("active");
    document.querySelector(`[data-view="${button.dataset.target}"]`).classList.add("active");
  });
});

$("mood").addEventListener("input",syncRanges);
$("energy").addEventListener("input",syncRanges);
$("saveCheckin").addEventListener("click",saveCheckin);
$("saveMissions").addEventListener("click",saveMissions);
$("exportData").addEventListener("click",exportData);
$("importData").addEventListener("change",event=>{
  if(event.target.files[0]) importData(event.target.files[0]);
});
$("resetData").addEventListener("click",()=>{
  if(confirm("Wirklich alle PHÖNIX-Daten auf diesem Gerät löschen?")){
    Object.keys(localStorage).filter(k=>k.startsWith("phoenix.")).forEach(k=>localStorage.removeItem(k));
    location.reload();
  }
});

if("serviceWorker" in navigator){
  window.addEventListener("load",()=>navigator.serviceWorker.register("./service-worker.js").catch(()=>{}));
}

syncRanges();
renderTasks();
renderMissions();
loadTodayEntry();
updateDashboard();
