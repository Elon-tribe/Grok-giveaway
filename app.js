// Save accounts in localStorage
function saveAccount(user) {
  localStorage.setItem("account", JSON.stringify(user));
}

function getAccount() {
  return JSON.parse(localStorage.getItem("account"));
}

function logout() {
  localStorage.removeItem("account");
  window.location.href = "login.html";
}

// Signup form
if (document.getElementById("signupForm")) {
  document.getElementById("signupForm").addEventListener("submit", e => {
    e.preventDefault();
    const name = document.getElementById("signupName").value;
    const email = document.getElementById("signupEmail").value;
    const password = document.getElementById("signupPassword").value;

    const user = {
      name,
      email,
      password,
      balance: 1000, // signup bonus
      history: ["Signup bonus: $1000"]
    };

    saveAccount(user);
    alert("Account created! You got a $1000 bonus.");
    window.location.href = "dashboard.html";
  });
}

// Login form
if (document.getElementById("loginForm")) {
  document.getElementById("loginForm").addEventListener("submit", e => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    const user = getAccount();
    if (user && user.email === email && user.password === password) {
      window.location.href = "dashboard.html";
    } else {
      alert("Invalid login");
    }
  });
}

// Dashboard
if (document.getElementById("balance")) {
  const user = getAccount();
  if (!user) {
    window.location.href = "login.html";
  } else {
    document.getElementById("userName").textContent = user.name;
    document.getElementById("balance").textContent = user.balance;
    const list = document.getElementById("historyList");
    user.history.forEach(item => {
      const li = document.createElement("li");
      li.textContent = item;
      list.appendChild(li);
    });
  }
}
