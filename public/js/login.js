// ===== Tab Switching =====
const tabLogin = document.getElementById('tabLogin');
const tabSignup = document.getElementById('tabSignup');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');

tabLogin.onclick = () => {
  tabLogin.classList.add('active');
  tabSignup.classList.remove('active');
  loginForm.style.display = 'block';
  signupForm.style.display = 'none';
};

tabSignup.onclick = () => {
  tabSignup.classList.add('active');
  tabLogin.classList.remove('active');
  signupForm.style.display = 'block';
  loginForm.style.display = 'none';
};

// ===== LOGIN =====
document.getElementById('loginBtn').addEventListener('click', async () => {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  if (!email || !password) {
    return showToast('Please enter both email and password', 'error');
  }

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (data.success) {
      showToast('Welcome back, ' + data.user.email, 'success');
      localStorage.setItem('noteloop_user', JSON.stringify(data.user));
      setTimeout(() => { window.location.href = 'dashboard.html'; }, 800);
    } else {
      showToast(data.message || 'Login failed', 'error');
    }
  } catch (err) {
    console.error(err);
    showToast('Server error. Please try again.', 'error');
  }
});

// ===== SIGN UP =====
document.getElementById('signupBtn').addEventListener('click', async () => {
  const email = document.getElementById('signupEmail').value.trim();
  const password = document.getElementById('signupPassword').value;
  const role = document.getElementById('signupRole').value;

  if (!email || !password) {
    return showToast('Please fill in all fields', 'error');
  }

  if (password.length < 6) {
    return showToast('Password must be at least 6 characters', 'error');
  }

  try {
    const res = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role })
    });
    const data = await res.json();

    if (data.success) {
      showToast('Account created! Welcome to NoteLoop 🎉', 'success');
      localStorage.setItem('noteloop_user', JSON.stringify(data.user));
      setTimeout(() => { window.location.href = 'dashboard.html'; }, 900);
    } else {
      showToast(data.message || 'Sign up failed', 'error');
    }
  } catch (err) {
    console.error(err);
    showToast('Server error. Please try again.', 'error');
  }
});