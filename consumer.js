const me = Auth.require('consumer');
const today = new Date().toISOString().slice(0, 10);
document.getElementById('date').min = today;
document.getElementById('date').value = today;
 
function render() {
  const meals = DB.get('tn_meals').filter(m => m.patient === me.name).reverse();
  document.getElementById('meals').innerHTML = meals.map(m =>
    `<div class="item"><div class="item-main"><span class="item-icon"><i data-lucide="utensils"></i></span><div><b>${esc(m.type)}</b>: ${esc(m.food)} <span class="tag">${m.cal} kcal</span><div class="muted">${m.when}</div></div></div></div>`).join('') || '<p class="muted">No meals yet.</p>';
 
  const appts = DB.get('tn_appts').filter(a => a.patient === me.name);
  document.getElementById('appts').innerHTML = appts.map(a =>
    `<div class="item"><div class="item-main"><span class="item-icon"><i data-lucide="calendar"></i></span><div>${a.date} ${a.time} with ${esc(a.dietitian)}<br>
     <a class="btn accent" href="session.html?room=${a.room}"><i data-lucide="video"></i> Join Session</a></div></div></div>`).join('') || '<p class="muted">No appointments.</p>';
 
  const notes = DB.get('tn_notes').filter(n => n.patient === me.name).reverse();
  document.getElementById('notes').innerHTML = notes.map(n =>
    `<div class="item"><div class="item-main"><span class="item-icon"><i data-lucide="file-text"></i></span><div>${esc(n.text)}<div class="muted">${n.when}</div></div></div></div>`).join('') || '<p class="muted">No notes yet.</p>';
 
  refreshIcons();
}
 
document.getElementById('addMeal').onclick = () => {
  const food = document.getElementById('food').value.trim();
  const cal = +document.getElementById('cal').value;
  if (!food || !cal) return toast('Enter food and calories','error');
  const meals = DB.get('tn_meals');
  meals.push({ patient: me.name, type: document.getElementById('type').value, food, cal, when: new Date().toLocaleString() });
  DB.set('tn_meals', meals);
  document.getElementById('food').value = ''; document.getElementById('cal').value = '';
  render();
};
 
document.getElementById('book').onclick = () => {
  const appts = DB.get('tn_appts');
  const date = document.getElementById('date').value, time = document.getElementById('time').value;
  const dietitian = document.getElementById('diet').value;
  if (appts.some(a => a.date === date && a.time === time && a.dietitian === dietitian)) return toast('That slot is already taken. Pick another time.','error');
  appts.push({ patient: me.name, date, time, dietitian, room: roomName() });
  DB.set('tn_appts', appts);
  render();
};
render();