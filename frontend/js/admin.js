// ============================================
// admin.js — Admin Panel Logic
// Currently handles: Teachers CRUD
// More sections added in later steps
// ============================================

const db = window._supabase; // shorthand


// ─────────────────────────────────────────
// HELPER: Show message in admin panel
// ─────────────────────────────────────────
function showAdminMsg(id, text, type) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  el.className = 'admin-msg ' + type;
  // Auto-hide success messages after 4 seconds
  if (type === 'success') {
    setTimeout(() => { el.className = 'admin-msg'; }, 4000);
  }
}


// ─────────────────────────────────────────
// ADD TEACHER
// 1. Upload photo to Supabase Storage (if provided)
// 2. Insert teacher row into DB
// ─────────────────────────────────────────
async function addTeacher() {
  const name    = document.getElementById('t-name').value.trim();
  const subject = document.getElementById('t-subject').value.trim();
  const exp     = parseInt(document.getElementById('t-exp').value) || 0;
  const bio     = document.getElementById('t-bio').value.trim();
  const photoInput = document.getElementById('t-photo');
  const photoFile  = photoInput.files[0]; // may be undefined

  // Validation
  if (!name || !subject) {
    return showAdminMsg('teacher-msg', 'Name and Subject are required.', 'error');
  }

  // Disable button to prevent double submit
  const btn = document.getElementById('btn-add-teacher');
  btn.textContent = 'Saving...';
  btn.disabled = true;

  let photo_url = null;

  // ── Step 1: Upload photo if provided ──
  if (photoFile) {
    // Create a unique filename using timestamp
    // e.g. "avatars/1701234567890_photo.jpg"
    const fileName = `${Date.now()}_${photoFile.name}`;

    const { data: uploadData, error: uploadError } = await db
      .storage
      .from('avatars')          // bucket name
      .upload(fileName, photoFile, {
        cacheControl: '3600',   // cache for 1 hour
        upsert: false           // don't overwrite existing files
      });

    if (uploadError) {
      btn.textContent = 'Add Teacher';
      btn.disabled = false;
      return showAdminMsg('teacher-msg', 'Photo upload failed: ' + uploadError.message, 'error');
    }

    // Get the public URL of the uploaded photo
    // Since bucket is public, this URL works without authentication
    const { data: urlData } = db
      .storage
      .from('avatars')
      .getPublicUrl(fileName);

    photo_url = urlData.publicUrl;
  }

  // ── Step 2: Insert teacher into database ──
  const { error: insertError } = await db
    .from('teachers')
    .insert({
      name,
      subject,
      experience: exp,
      bio,
      photo_url   // will be null if no photo uploaded
    });

  btn.textContent = 'Add Teacher';
  btn.disabled = false;

  if (insertError) {
    return showAdminMsg('teacher-msg', 'Error: ' + insertError.message, 'error');
  }

  // ── Step 3: Clear form and reload table ──
  document.getElementById('t-name').value    = '';
  document.getElementById('t-subject').value = '';
  document.getElementById('t-exp').value     = '';
  document.getElementById('t-bio').value     = '';
  document.getElementById('t-photo').value   = '';
  document.getElementById('photo-preview').style.display = 'none';

  showAdminMsg('teacher-msg', '✅ Teacher added successfully!', 'success');
  loadTeachers(); // refresh the table
}


// ─────────────────────────────────────────
// LOAD TEACHERS — fills the admin table
// ─────────────────────────────────────────
async function loadTeachers() {
  const tbody = document.getElementById('teachers-table-body');
  if (!tbody) return;

  // Fetch all teachers, newest first
  const { data: teachers, error } = await db
    .from('teachers')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    tbody.innerHTML = `<tr><td colspan="5" style="color:red; text-align:center;">
      Failed to load: ${error.message}</td></tr>`;
    return;
  }

  if (!teachers || teachers.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;
      color:var(--text-muted); padding:28px;">No teachers added yet.</td></tr>`;
    return;
  }

  // Build table rows
  tbody.innerHTML = teachers.map(t => `
    <tr>
      <td>
        ${t.photo_url
          ? `<img src="${t.photo_url}" class="teacher-avatar" alt="${t.name}"/>`
          : `<div style="width:38px;height:38px;border-radius:50%;
              background:var(--navy);color:white;display:flex;
              align-items:center;justify-content:center;font-weight:700;font-size:0.9rem;">
              ${t.name.charAt(0).toUpperCase()}
             </div>`
        }
      </td>
      <td><strong>${t.name}</strong></td>
      <td><span class="badge badge-blue">${t.subject}</span></td>
      <td>${t.experience > 0 ? t.experience + ' yrs' : '—'}</td>
      <td>
        <button class="btn-danger" onclick="deleteTeacher('${t.id}', '${t.name}')">
          Delete
        </button>
      </td>
    </tr>
  `).join('');
}


// ─────────────────────────────────────────
// DELETE TEACHER
// ─────────────────────────────────────────
async function deleteTeacher(id, name) {
  // Always confirm before deleting
  if (!confirm(`Delete teacher "${name}"? This cannot be undone.`)) return;

  const { error } = await db
    .from('teachers')
    .delete()
    .eq('id', id); // only delete the row where id matches

  if (error) {
    alert('Delete failed: ' + error.message);
    return;
  }

  loadTeachers(); // refresh table
}

// ─────────────────────────────────────────
// LOAD TEACHERS into course form dropdown
// Called when admin clicks Courses tab
// ─────────────────────────────────────────
async function loadTeacherDropdown() {
  const select = document.getElementById('c-teacher');
  if (!select) return;

  const { data: teachers } = await db
    .from('teachers')
    .select('id, name, subject')
    .order('name');

  if (!teachers) return;

  // Clear existing options except the placeholder
  select.innerHTML = '<option value="">— Select Teacher —</option>';

  teachers.forEach(t => {
    const opt = document.createElement('option');
    opt.value = t.id;
    opt.textContent = `${t.name} (${t.subject})`;
    select.appendChild(opt);
  });
}


// ─────────────────────────────────────────
// THUMBNAIL PREVIEW
// ─────────────────────────────────────────
function previewThumbnail(input) {
  const preview = document.getElementById('thumbnail-preview');
  if (input.files && input.files[0]) {
    preview.src = URL.createObjectURL(input.files[0]);
    preview.style.display = 'block';
  }
}


// ─────────────────────────────────────────
// ADD COURSE
// 1. Upload thumbnail (optional)
// 2. Insert course row
// ─────────────────────────────────────────
async function addCourse() {
  const title      = document.getElementById('c-title').value.trim();
  const priceRs    = parseFloat(document.getElementById('c-price').value) || 0;
  const teacherId  = document.getElementById('c-teacher').value || null;
  const desc       = document.getElementById('c-desc').value.trim();
  const isPublished= document.getElementById('c-published').value === 'true';
  const thumbInput = document.getElementById('c-thumbnail');
  const thumbFile  = thumbInput.files[0];

  if (!title) {
    return showAdminMsg('course-msg', 'Course title is required.', 'error');
  }

  const btn = document.getElementById('btn-add-course');
  btn.textContent = 'Saving...';
  btn.disabled = true;

  // Convert ₹ to paise for storage
  // ₹499 → 49900
  const priceInPaise = Math.round(priceRs * 100);

  let thumbnail_url = null;

  // Upload thumbnail if provided
  if (thumbFile) {
    const fileName = `${Date.now()}_${thumbFile.name}`;

    const { error: uploadError } = await db
      .storage
      .from('thumbnails')
      .upload(fileName, thumbFile, { cacheControl: '3600', upsert: false });

    if (uploadError) {
      btn.textContent = 'Add Course';
      btn.disabled = false;
      return showAdminMsg('course-msg',
        'Thumbnail upload failed: ' + uploadError.message, 'error');
    }

    const { data: urlData } = db
      .storage
      .from('thumbnails')
      .getPublicUrl(fileName);

    thumbnail_url = urlData.publicUrl;
  }

  // Insert course into DB
  const { error } = await db.from('courses').insert({
    title,
    description:   desc,
    price:         priceInPaise,
    teacher_id:    teacherId,
    thumbnail_url,
    is_published:  isPublished
  });

  btn.textContent = 'Add Course';
  btn.disabled = false;

  if (error) {
    return showAdminMsg('course-msg', 'Error: ' + error.message, 'error');
  }

  // Clear form
  document.getElementById('c-title').value   = '';
  document.getElementById('c-price').value   = '';
  document.getElementById('c-desc').value    = '';
  document.getElementById('c-thumbnail').value = '';
  document.getElementById('thumbnail-preview').style.display = 'none';
  document.getElementById('c-teacher').selectedIndex = 0;
  document.getElementById('c-published').selectedIndex = 0;

  showAdminMsg('course-msg', '✅ Course added successfully!', 'success');
  loadCourses();
}


// ─────────────────────────────────────────
// LOAD COURSES — fills admin table
// ─────────────────────────────────────────
async function loadCourses() {
  const tbody = document.getElementById('courses-table-body');
  if (!tbody) return;

  const { data: courses, error } = await db
    .from('courses')
    .select(`*, teachers(name)`)
    .order('created_at', { ascending: false });

  if (error || !courses) {
    tbody.innerHTML = `<tr><td colspan="5"
      style="color:red;text-align:center;">Failed to load.</td></tr>`;
    return;
  }

  if (courses.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5"
      style="text-align:center;color:var(--text-muted);padding:28px;">
      No courses yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = courses.map(c => `
    <tr>
      <td><strong>${c.title}</strong></td>
      <td>${c.teachers?.name || '—'}</td>
      <td>${c.price === 0 ? 'FREE' : '₹' + (c.price / 100).toLocaleString('en-IN')}</td>
      <td>
        <span class="badge ${c.is_published ? 'badge-green' : 'badge-gray'}">
          ${c.is_published ? '✅ Published' : '📝 Draft'}
        </span>
      </td>
      <td style="display:flex;gap:8px;">
        <button class="badge badge-blue"
          style="cursor:pointer;border:none;"
          onclick="togglePublish('${c.id}', ${c.is_published})">
          ${c.is_published ? 'Unpublish' : 'Publish'}
        </button>
        <button class="btn-danger" onclick="deleteCourse('${c.id}', '${c.title}')">
          Delete
        </button>
      </td>
    </tr>
  `).join('');
}


// ─────────────────────────────────────────
// TOGGLE PUBLISH STATUS
// ─────────────────────────────────────────
async function togglePublish(id, currentStatus) {
  const { error } = await db
    .from('courses')
    .update({ is_published: !currentStatus })
    .eq('id', id);

  if (error) { alert('Failed: ' + error.message); return; }
  loadCourses();
}


// ─────────────────────────────────────────
// DELETE COURSE
// ─────────────────────────────────────────
async function deleteCourse(id, title) {
  if (!confirm(`Delete course "${title}"? This cannot be undone.`)) return;

  const { error } = await db.from('courses').delete().eq('id', id);
  if (error) { alert('Delete failed: ' + error.message); return; }
  loadCourses();
}