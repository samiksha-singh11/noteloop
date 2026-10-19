const user = JSON.parse(localStorage.getItem('noteloop_user'));
if (!user) window.location.href = 'index.html';

document.getElementById('userEmail').textContent = user.email;

if (user.role !== 'senior') {
  document.getElementById('uploadTab').style.display = 'none';
}

document.getElementById('logoutBtn').onclick = () => {
  showToast('Logged out. See you soon.', 'info');
  setTimeout(() => {
    localStorage.removeItem('noteloop_user');
    window.location.href = 'index.html';
  }, 700);
};

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
    grid.innerHTML = '<p style="color: var(--text-muted); grid-column: 1/-1; text-align: center; padding: 2rem;">No resources found. Be the first to upload.</p>';
    return;
  }

  data.notes.forEach(n => {
    const card = document.createElement('div');
    card.className = 'note-card';
    
    let downloadBtn = '';
    if (n.file_path) {
      downloadBtn = `<a href="${n.file_path}" target="_blank" class="download-link">View / Download File</a>`;
    }

    card.innerHTML = `
      <h4>${n.title}</h4>
      <div class="tags">
        <span class="tag type">${n.branch}</span>
        <span class="tag subject">${n.subject}</span>
        <span class="tag semester">Sem ${n.semester}</span>
        <span class="tag type" style="background: #E8DCC8; color: #5D4037;">${n.type}</span>
      </div>
      <div class="meta">
        <span>By: ${n.uploader_email || 'Unknown'}</span>
        <span>${new Date(n.created_at).toLocaleDateString()}</span>
      </div>
      ${downloadBtn}
    `;
    grid.appendChild(card);
  });
}

// Filters
document.getElementById('applyFilters').onclick = () => {
  loadNotes({
    branch:   document.getElementById('filterBranch').value,
    subject:  document.getElementById('filterSubject').value.trim(),
    semester: document.getElementById('filterSemester').value,
    type:     document.getElementById('filterType').value
  });
};

document.getElementById('resetFilters').onclick = () => {
  document.getElementById('filterBranch').value = '';
  document.getElementById('filterSubject').value = '';
  document.getElementById('filterSemester').value = '';
  document.getElementById('filterType').value = '';
  loadNotes();
};

// File Upload
const fileDropZone = document.getElementById('fileDropZone');
const fileInput = document.getElementById('fileInput');
const fileNameDisplay = document.getElementById('fileName');
let selectedFile = null;

fileDropZone.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (e) => {
  if (e.target.files.length > 0) {
    selectedFile = e.target.files[0];
    fileNameDisplay.textContent = `Selected: ${selectedFile.name}`;
  }
});

fileDropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  fileDropZone.classList.add('dragover');
});

fileDropZone.addEventListener('dragleave', () => {
  fileDropZone.classList.remove('dragover');
});

fileDropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  fileDropZone.classList.remove('dragover');
  if (e.dataTransfer.files.length > 0) {
    selectedFile = e.dataTransfer.files[0];
    fileInput.files = e.dataTransfer.files;
    fileNameDisplay.textContent = `Selected: ${selectedFile.name}`;
  }
});

document.getElementById('uploadBtn')?.addEventListener('click', async () => {
  const branch = document.getElementById('branch').value;
  const subject = document.getElementById('subject').value.trim();
  const title = document.getElementById('title').value.trim();
  const type = document.getElementById('type').value;
  const semester = document.getElementById('semester').value;

  if (!branch || !subject || !title) {
    return showToast('Please fill all text fields', 'error');
  }
  if (!selectedFile) {
    return showToast('Please select a file to upload', 'error');
  }

  const formData = new FormData();
  formData.append('branch', branch);
  formData.append('subject', subject);
  formData.append('title', title);
  formData.append('type', type);
  formData.append('semester', semester);
  formData.append('uploaded_by', user.id);
  formData.append('file', selectedFile);

  try {
    const res = await fetch('/api/upload-note', {
      method: 'POST',
      body: formData
    });
    
    const data = await res.json();

    if (data.success) {
      showToast('Resource uploaded successfully!', 'success');
      document.getElementById('subject').value = '';
      document.getElementById('title').value = '';
      fileInput.value = '';
      selectedFile = null;
      fileNameDisplay.textContent = '';
      loadNotes();
    } else {
      showToast(data.message || 'Upload failed', 'error');
    }
  } catch (err) {
    console.error(err);
    showToast('Server error during upload', 'error');
  }
});

loadNotes();