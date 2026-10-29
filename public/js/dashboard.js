const user = JSON.parse(localStorage.getItem('noteloop_user'));
if (!user) window.location.href = 'index.html';

document.getElementById('userEmail').textContent = user.email;

if (user.role !== 'senior') {
  document.getElementById('uploadTab').style.display = 'none';
}

// ===================== SIDEBAR =====================
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('sidebarOverlay');
const sidebarLinks = document.querySelectorAll('.sidebar-link');
const pageSections = document.querySelectorAll('.page-section');

function toggleSidebar() {
  sidebar.classList.toggle('open');
  overlay.classList.toggle('open');
}

menuToggle.addEventListener('click', toggleSidebar);
overlay.addEventListener('click', toggleSidebar);

sidebarLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    sidebarLinks.forEach(l => l.classList.remove('active'));
    pageSections.forEach(p => p.classList.remove('active'));
    link.classList.add('active');
    document.getElementById(link.dataset.target).classList.add('active');
    if (window.innerWidth < 768) toggleSidebar();
  });
});

document.getElementById('logoutBtn').onclick = () => {
  if(confirm('Are you sure you want to log out?')) {
    localStorage.removeItem('noteloop_user');
    window.location.href = 'index.html';
  }
};

// ===================== NOTES & SKELETONS =====================
function renderSkeletons() {
  const grid = document.getElementById('notesGrid');
  grid.innerHTML = '';
  for (let i = 0; i < 6; i++) {
    grid.innerHTML += `
      <div class="note-card skeleton">
        <div class="skeleton-title"></div>
        <div class="skeleton-tags">
          <span class="skeleton-tag"></span>
          <span class="skeleton-tag"></span>
        </div>
        <div class="skeleton-meta"></div>
        <div class="skeleton-btn"></div>
      </div>
    `;
  }
}

async function loadNotes(params = {}) {
  renderSkeletons(); // Show loading state

  const query = new URLSearchParams(params).toString();
  const res = await fetch(`/api/notes?${query}`);
  const data = await res.json();

  const grid = document.getElementById('notesGrid');
  grid.innerHTML = ''; // Clear skeletons

  if (!data.notes.length) {
    const isSenior = user.role === 'senior';
    const title = isSenior ? "No resources here yet." : "No notes found.";
    const subtitle = isSenior 
      ? "Be the first to share a note with your juniors!" 
      : "Try adjusting your filters or check back later.";

    grid.innerHTML = `
      <div class="empty-state">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
        </svg>
        <h3>${title}</h3>
        <p>${subtitle}</p>
      </div>
    `;
    return;
  }

  data.notes.forEach(n => {
    const card = document.createElement('div');
    card.className = 'note-card';
    let actionBtn = '';
    if (n.file_path) {
      const ext = n.file_path.split('.').pop().toLowerCase();
      if (['pdf', 'txt', 'jpg', 'jpeg', 'png'].includes(ext)) {
        actionBtn = `<button onclick="viewFile('${n.file_path}')" class="download-link" style="border: none; cursor: pointer; background:transparent;">View File</button>`;
      } else {
        actionBtn = `<a href="${n.file_path}" target="_blank" class="download-link">Download File</a>`;
      }
    }
    let deleteBtn = user.id === n.uploaded_by ? `<button class="delete-btn" onclick="deleteNote(${n.id})">Delete Resource</button>` : '';
    
    card.innerHTML = `
      <h4>${n.title}</h4>
      <div class="tags">
        <span class="tag">${n.branch}</span><span class="tag">${n.subject}</span>
        <span class="tag">Sem ${n.semester}</span><span class="tag">${n.type}</span>
      </div>
      <div class="meta">
        <span>By: ${n.uploader_email || 'Unknown'}</span>
        <span>${new Date(n.created_at).toLocaleDateString()}</span>
      </div>
      ${actionBtn} ${deleteBtn}
    `;
    grid.appendChild(card);
  });
}

document.getElementById('applyFilters').onclick = () => {
  loadNotes({
    branch: document.getElementById('filterBranch').value,
    subject: document.getElementById('filterSubject').value.trim(),
    semester: document.getElementById('filterSemester').value,
    type: document.getElementById('filterType').value
  });
};
document.getElementById('resetFilters').onclick = () => {
  document.querySelectorAll('.filters select').forEach(s => s.value = '');
  document.getElementById('filterSubject').value = '';
  loadNotes();
};

// ===================== UPLOAD LOGIC =====================
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

document.getElementById('uploadBtn')?.addEventListener('click', async () => {
  const branch = document.getElementById('branch').value;
  const subject = document.getElementById('subject').value.trim();
  const title = document.getElementById('title').value.trim();
  const type = document.getElementById('type').value;
  const semester = document.getElementById('semester').value;

  if (!branch || !subject || !title || !selectedFile) {
    return showToast('Please fill all fields and select a file', 'error');
  }

  const formData = new FormData();
  formData.append('branch', branch); formData.append('subject', subject);
  formData.append('title', title); formData.append('type', type);
  formData.append('semester', semester); formData.append('uploaded_by', user.id);
  formData.append('file', selectedFile);

  try {
    const res = await fetch('/api/upload-note', { method: 'POST', body: formData });
    const data = await res.json();
    if (data.success) {
      showToast('Resource uploaded successfully!', 'success');
      document.getElementById('subject').value = '';
      document.getElementById('title').value = '';
      fileInput.value = ''; fileNameDisplay.textContent = ''; selectedFile = null;
      loadNotes();
      document.querySelector('.sidebar-link[data-target="browse"]').click();
    } else {
      showToast(data.message || 'Upload failed', 'error');
    }
  } catch (err) { showToast('Server error during upload.', 'error'); }
});

window.viewFile = function(url) {
    const newWindow = window.open("", "_blank");
    newWindow.document.write(`<html><body style="margin:0;"><iframe src="${url}" style="width:100%; height:100vh; border:none;"></iframe></body></html>`);
    newWindow.document.close();
};

async function deleteNote(id) {
  if (!confirm('Are you sure you want to delete this resource?')) return;
  try {
    const res = await fetch(`/api/notes/${id}`, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uploaded_by: user.id })
    });
    const data = await res.json();
    if (data.success) { showToast('Resource deleted.', 'success'); loadNotes(); }
    else { showToast(data.message || 'Delete failed', 'error'); }
  } catch (err) { showToast('Server error during delete', 'error'); }
}

// ===================== CURRICULUM HUB =====================
const currBranch = document.getElementById('currBranch');
const currSemester = document.getElementById('currSemester');
const currSubject = document.getElementById('currSubject');
const currUnits = document.getElementById('currUnits');
const currPlaceholder = document.getElementById('currPlaceholder');

let allSyllabusData = [];

currBranch.addEventListener('change', () => {
  currSemester.disabled = !currBranch.value;
  currSemester.value = '';
  currSubject.disabled = true;
  currSubject.innerHTML = '<option value="">Select Subject</option>';
  currUnits.style.display = 'none';
  currPlaceholder.style.display = 'block';
});

currSemester.addEventListener('change', async () => {
  if (!currSemester.value) {
    currSubject.disabled = true;
    return;
  }
  currSubject.disabled = false;
  currSubject.innerHTML = '<option value="">Loading...</option>';

  try {
    const res = await fetch(`/api/syllabus?branch=${currBranch.value}&semester=${currSemester.value}`);
    const data = await res.json();
    allSyllabusData = data.syllabus || [];
    
    const subjects = [...new Set(allSyllabusData.map(s => s.subject))];
    currSubject.innerHTML = '<option value="">Select Subject</option>';
    subjects.forEach(sub => {
      currSubject.innerHTML += `<option value="${sub}">${sub}</option>`;
    });
  } catch (err) {
    currSubject.innerHTML = '<option value="">Error loading</option>';
  }
});

currSubject.addEventListener('change', () => {
  if (!currSubject.value) {
    currUnits.style.display = 'none';
    currPlaceholder.style.display = 'block';
    return;
  }

  const filtered = allSyllabusData.filter(s => s.subject === currSubject.value);
  currUnits.innerHTML = '';
  filtered.forEach(item => {
    currUnits.innerHTML += `
      <div class="unit-card">
        <div class="unit-header">
          <span class="unit-title">${item.unit}</span>
        </div>
        <div class="unit-topics">${item.topics}</div>
      </div>
    `;
  });

  currPlaceholder.style.display = 'none';
  currUnits.style.display = 'flex';
});

loadNotes();