/* Demo app.js - client-side only (localStorage). Replace with real backend in production. */

const GIVEAWAYS = [
  { id: "g1", title: "Grok Starter Pack", amount: 50, desc: "Starter credit for new community members." },
  { id: "g2", title: "AI Trial Credit", amount: 10, desc: "Short trial credit to test AI signals." },
  { id: "g3", title: "Referral Boost", amount: 20, desc: "Bonus for community referrals." }
];

const KEYS = {
  USERS: "grok_demo_users",
  PENDING: "grok_demo_pending",
  SESSION: "grok_demo_session"
};

function load(key){ try { return JSON.parse(localStorage.getItem(key) || "null"); } catch(e){ return null; } }
function save(key, val){ localStorage.setItem(key, JSON.stringify(val)); }

function getUsers(){ return load(KEYS.USERS) || []; }
function setUsers(u){ save(KEYS.USERS, u); }
function getPending(){ return load(KEYS.PENDING) || []; }
function setPending(p){ save(KEYS.PENDING, p); }
function setSession(email){ save(KEYS.SESSION, { email, at:Date.now() }); }
function getSession(){ return load(KEYS.SESSION); }
function clearSession(){ localStorage.removeItem(KEYS.SESSION); }

function findUser(email){ return getUsers().find(u => u.email.toLowerCase() === (email||"").toLowerCase()); }
function updateUser(user){ const users = getUsers().map(u => u.email === user.email ? user : u); setUsers(users); }

function formatMoney(n){ return "$" + Number(n||0).toFixed(2); }

//// UI wiring
document.addEventListener("DOMContentLoaded", ()=>{
  renderGiveawayList();
  renderGiveawayOptions();
  bindForms();
  renderAuthState();
});

function renderGiveawayList(){
  const ul = document.getElementById("giveaway-list");
  ul.innerHTML = "";
  GIVEAWAYS.forEach(g=>{
    const li = document.createElement("li");
    li.innerHTML = `<strong>${g.title}</strong> — ${formatMoney(g.amount)}<div class="muted">${g.desc}</div>`;
    ul.appendChild(li);
  });
}

function renderGiveawayOptions(){
  const sel = document.getElementById("req-giveaway");
  sel.innerHTML = "";
  GIVEAWAYS.forEach(g=> {
    const opt = document.createElement("option"); opt.value = g.id; opt.textContent = `${g.title} — ${formatMoney(g.amount)}`;
    sel.appendChild(opt);
  });
}

function bindForms(){
  document.getElementById("signup-form").addEventListener("submit", e=>{
    e.preventDefault();
    const name = document.getElementById("su-name").value.trim();
    const email = document.getElementById("su-email").value.trim().toLowerCase();
    const pass = document.getElementById("su-pass").value;
    if(findUser(email)){ return alert("An account with that email already exists (demo)."); }
    const user = { name, email, pass, balance:0, tx: [] };
    const users = getUsers(); users.push(user); setUsers(users);
    setSession(email);
    alert("Account created (demo). You are logged in.");
    renderAuthState();
  });

  document.getElementById("login-form").addEventListener("submit", e=>{
    e.preventDefault();
    const email = document.getElementById("li-email").value.trim().toLowerCase();
    const pass = document.getElementById("li-pass").value;
    const u = findUser(email);
    if(!u || u.pass !== pass) return alert("Invalid credentials (demo).");
    setSession(email);
    alert("Logged in (demo).");
    renderAuthState();
  });

  document.getElementById("btn-guest").addEventListener("click", ()=>{
    // create or login guest
    const email = "guest@demo.local";
    let u = findUser(email);
    if(!u){
      u = { name: "Demo Guest", email, pass: "guest", balance: 15, tx: [{type:"credit", amount:15, note:"Demo starting credit", date: new Date().toISOString()}] };
      const users = getUsers(); users.push(u); setUsers(users);
    }
    setSession(email);
    renderAuthState();
  });

  document.getElementById("request-giveaway-form").addEventListener("submit", e=>{
    e.preventDefault();
    const email = document.getElementById("req-email").value.trim().toLowerCase();
    const gId = document.getElementById("req-giveaway").value;
    const note = document.getElementById("req-note").value.trim();
    const u = findUser(email);
    if(!u) return alert("No user found with that email. Create account first (demo).");
    const pending = getPending();
    pending.push({ id: 'req-' + Date.now(), email, giveawayId: gId, note, status: "pending", requestedAt: new Date().toISOString() });
    setPending(pending);
    alert("Giveaway request submitted. An admin can approve to credit your balance.");
    renderAdminPending(); renderMyPending();
  });

  document.getElementById("admin-auth-form").addEventListener("submit", e=>{
    e.preventDefault();
    const pass = document.getElementById("admin-pass").value.trim();
    if(pass === "grokadmin"){
      document.getElementById("admin-panel").classList.remove("hidden");
      renderAdminPending();
    } else alert("Wrong demo passcode.");
  });

  document.getElementById("btn-logout").addEventListener("click", ()=>{
    clearSession(); renderAuthState();
  });

  // small menu toggle for mobile
  document.getElementById("menu-toggle").addEventListener("click", ()=>{
    document.querySelector(".nav").classList.toggle("open");
  });
}

function renderAuthState(){
  const sess = getSession();
  const dash = document.getElementById("dashboard");
  const navAuth = document.getElementById("nav-auth");
  if(sess && sess.email){
    // show dashboard
    const u = findUser(sess.email);
    if(!u){ clearSession(); renderAuthState(); return; }
    document.getElementById("dash-name").textContent = u.name;
    document.getElementById("dash-email").textContent = u.email;
    document.getElementById("dash-balance").textContent = formatMoney(u.balance);
    renderTxList(u);
    renderMyPending();
    dash.classList.remove("hidden");
    window.location.hash = "#dashboard";
    navAuth.textContent = "Dashboard";
  } else {
    dash.classList.add("hidden");
    navAuth.textContent = "Sign up / Log in";
  }
}

function renderTxList(u){
  const ul = document.getElementById("tx-list");
  ul.innerHTML = "";
  const tx = (u.tx || []).slice().reverse();
  if(tx.length === 0) ul.innerHTML = "<li class='muted'>No transactions yet.</li>";
  tx.forEach(t=>{
    const li = document.createElement("li");
    li.innerHTML = `<strong>${t.type === 'credit' ? '+' : '-'}${formatMoney(t.amount)}</strong> <div class="muted">${t.note || ''} • ${new Date(t.date).toLocaleString()}</div>`;
    ul.appendChild(li);
  });
}

function renderMyPending(){
  const sess = getSession(); if(!sess) return;
  const pending = getPending().filter(p => p.email.toLowerCase() === sess.email.toLowerCase());
  const ul = document.getElementById("my-pending-list"); ul.innerHTML = "";
  if(pending.length === 0) ul.innerHTML = "<li class='muted'>No pending requests.</li>";
  pending.forEach(p=>{
    const g = GIVEAWAYS.find(x=>x.id===p.giveawayId);
    const li = document.createElement("li");
    li.innerHTML = `<strong>${g ? g.title : p.giveawayId}</strong> — ${p.status.toUpperCase()} <div class="muted">${p.note || ''} • ${new Date(p.requestedAt).toLocaleString()}</div>`;
    ul.appendChild(li);
  });
}

function renderAdminPending(){
  const ul = document.getElementById("admin-pending-list");
  const pending = getPending();
  ul.innerHTML = "";
  if(pending.length === 0) ul.innerHTML = "<li class='muted'>No pending giveaway requests.</li>";
  pending.forEach(p=>{
    const g = GIVEAWAYS.find(x=>x.id===p.giveawayId);
    const li = document.createElement("li");
    li.innerHTML = `<div><strong>${g ? g.title : p.giveawayId}</strong> — ${formatMoney(g ? g.amount : 0)} <div class="muted">${p.email} • ${new Date(p.requestedAt).toLocaleString()}</div></div>`;
    const btnApprove = document.createElement("button"); btnApprove.className="btn primary"; btnApprove.textContent="Approve";
    const btnReject = document.createElement("button"); btnReject.className="btn ghost"; btnReject.textContent="Reject";
    btnApprove.addEventListener("click", ()=> adminApprove(p.id));
    btnReject.addEventListener("click", ()=> adminReject(p.id));
    const controls = document.createElement("div"); controls.style.marginTop="8px"; controls.appendChild(btnApprove); controls.appendChild(btnReject);
    li.appendChild(controls);
    ul.appendChild(li);
  });
}

function adminApprove(reqId){
  const pending = getPending();
  const req = pending.find(p=>p.id===reqId); if(!req) return;
  if(req.status !== "pending"){ alert("Already handled."); return; }
  const g = GIVEAWAYS.find(x=>x.id===req.giveawayId);
  const amount = g ? g.amount : 0;
  const users = getUsers();
  const user = users.find(u => u.email.toLowerCase() === req.email.toLowerCase());
  if(!user){ return alert("User not found. They should sign up first."); }
  user.balance = (user.balance || 0) + amount;
  user.tx = user.tx || [];
  user.tx.push({ type:"credit", amount, date: new Date().toISOString(), note: `Giveaway: ${g ? g.title : req.giveawayId}`});
  updateUser(user);
  // mark request approved
  req.status = "approved";
  setPending(pending);
  alert(`Approved and credited ${user.email} ${formatMoney(amount)} (demo).`);
  renderAdminPending();
  renderMyPending();
  renderAuthState();
}

function adminReject(reqId){
  const pending = getPending();
  const req = pending.find(p=>p.id===reqId); if(!req) return;
  req.status = "rejected";
  setPending(pending);
  alert("Request rejected (demo).");
  renderAdminPending();
  renderMyPending();
}
