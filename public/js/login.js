// ==========================================
// 1. Handle Enter Key (Email -> Password -> Submit)
// ==========================================
document.getElementById('loginEmail').addEventListener('keypress', function (e) {
  if (e.key === 'Enter') {
    e.preventDefault(); // Stop page reload
    document.getElementById('loginPassword').focus();
  }
});

document.getElementById('loginPassword').addEventListener('keypress', function (e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    document.getElementById('loginBtn').click();
  }
});

// Sign up Enter keys
document.getElementById('signupEmail').addEventListener('keypress', function (e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    document.getElementById('signupPassword').focus();
  }
});

// ==========================================
// 2. LOGIN Action
// ==========================================
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

// ==========================================
// 3. SIGN UP Action
// ==========================================
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
      showToast('Account created! Welcome to NoteLoop', 'success');
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