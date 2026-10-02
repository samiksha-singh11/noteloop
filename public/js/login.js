document.getElementById('loginBtn').addEventListener('click', async () => {
  const email = document.getElementById('email').value.trim();
  const role = document.getElementById('role').value;

  if (!email) return alert('Please enter your email');

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role })
    });
    const data = await res.json();

    if (data.success) {
      localStorage.setItem('noteloop_user', JSON.stringify(data.user));
      window.location.href = 'dashboard.html';
    } else {
      alert(data.message || 'Login failed');
    }
  } catch (err) {
    console.error(err);
    alert('Server error');
  }
});