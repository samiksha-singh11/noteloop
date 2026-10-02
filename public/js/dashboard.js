const user = JSON.parse(localStorage.getItem('noteloop_user'));
if (!user) window.location.href = 'index.html';

document.getElementById('userEmail').textContent = user.email;

// Hide upload tab for juniors
if (user.role !== 'senior') {
  document.getElementById('uploadTab').style.display = 'none';
}

// Logout
document.getElementById('logoutBtn').onclick = () => {
  localStorage.removeItem('noteloop_user');
  window.location.href = 'index.html';
};

// Tab switching
document.querySelectorAll('.tab').forEach(tab => {
  tab.onclick = () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(tab.dataset.tab).classList.add('active');
  };
});

// Load notes
async function loadNotes(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`/api/notes?${query}`);
  const data = await res.json();

  const grid = document.getElementById('notesGrid');
  grid.innerHTML = '';

  if (!data.notes.length) {
    grid.innerHTML = '<p>No resources found. Seniors, be the first to upload! 🚀</p>';
    return;
  }

  data.notes.forEach(n => {
    const card = document.createElement('div');
    card.className = 'note-card';
    card.innerHTML = `
      <h4>${n.title}</h4>
      <div class="tags">
        <span class="tag type">📘 ${n.type}</span>
        <span class="tag subject">${n.subject}</span>
        <span class="tag semester">📅 Semester ${n.semester}</span>
      </div>
      <div class="meta">
        <span>👤 ${n.uploader_email || 'Unknown'}</span>
        <span>📅 ${new Date(n.created_at).toLocaleDateString()}</span>
      </div>
    `;
    grid.appendChild(card);
  });
}

// Filters
document.getElementById('applyFilters').onclick = () => {
  loadNotes({
    subject:  document.getElementById('filterSubject').value,
    semester: document.getElementById('filterSemester').value,
    type:     document.getElementById('filterType').value
  });
};

document.getElementById('resetFilters').onclick = () => {
  document.querySelectorAll('.filters select').forEach(s => s.value = '');
  loadNotes();
};

// Upload
document.getElementById('uploadBtn')?.addEventListener('click', async () => {
  const payload = {
    title:       document.getElementById('title').value.trim(),
    subject:     document.getElementById('subject').value,
    type:        document.getElementById('type').value,
    semester:    document.getElementById('semester').value,
    uploaded_by: user.id
  };

  if (!payload.title || !payload.subject) return alert('Please fill all fields');

  const res = await fetch('/api/upload-note', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();

  if (data.success) {
    alert('✅ Resource uploaded!');
    document.getElementById('title').value = '';
    loadNotes();
  } else {
    alert(data.message || 'Upload failed');
  }
});

// Initial load
loadNotes();