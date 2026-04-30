// ============================================
// courses.js — Course listing page logic
// Handles: loading, filtering, search
// ============================================

// We store all courses here after first fetch
// so filtering doesn't need a new DB call each time
let allCourses   = [];
let purchasedIds = []; // course IDs the logged-in user has bought


// ─────────────────────────────────────────
// INIT — called on page load
// ─────────────────────────────────────────
async function initCoursesPage() {
  // 1. Check if user is logged in (non-blocking — page is public)
  const user = await getCurrentUser();

  // 2. If logged in, fetch their purchased course IDs
  if (user) {
    const { data: purchases } = await window._supabase
      .from('purchases')
      .select('course_id')
      .eq('user_id', user.id)
      .eq('status', 'completed');

    // Store just the IDs in a flat array for easy lookup
    // e.g. ['uuid-1', 'uuid-2']
    purchasedIds = (purchases || []).map(p => p.course_id);
  }

  // 3. Fetch all published courses with teacher name
  const { data: courses, error } = await window._supabase
    .from('courses')
    .select(`
      *,
      teachers ( name, subject )
    `)
    // Join courses with teachers table to get teacher name
    // Supabase handles this automatically via the foreign key
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  if (error) {
    document.getElementById('courses-grid').innerHTML = `
      <div class="state-box">
        <div class="state-icon">❌</div>
        <p>Failed to load courses. Please refresh.</p>
      </div>`;
    return;
  }

  allCourses = courses || [];

  // 4. Populate subject filter dropdown from actual data
  buildSubjectFilter(allCourses);

  // 5. Render all courses
  renderCourses(allCourses);
}


// ─────────────────────────────────────────
// BUILD SUBJECT FILTER
// Extracts unique subjects from courses
// ─────────────────────────────────────────
function buildSubjectFilter(courses) {
  const select = document.getElementById('subject-filter');
  if (!select) return;

  // Get unique subject names from teacher data
  const subjects = [...new Set(
    courses
      .map(c => c.teachers?.subject)
      .filter(Boolean) // remove nulls
  )].sort();

  // Add one <option> per subject
  subjects.forEach(subject => {
    const opt = document.createElement('option');
    opt.value = subject;
    opt.textContent = subject;
    select.appendChild(opt);
  });
}


// ─────────────────────────────────────────
// FILTER COURSES
// Called on every keypress / dropdown change
// ─────────────────────────────────────────
function filterCourses() {
  const searchTerm = document.getElementById('search-input').value.toLowerCase();
  const subject    = document.getElementById('subject-filter').value;

  const filtered = allCourses.filter(course => {
    // Check if title or description matches search
    const matchesSearch =
      !searchTerm ||
      course.title.toLowerCase().includes(searchTerm) ||
      (course.description || '').toLowerCase().includes(searchTerm);

    // Check if subject matches filter
    const matchesSubject =
      !subject ||
      course.teachers?.subject === subject;

    return matchesSearch && matchesSubject;
  });

  renderCourses(filtered);
}


// ─────────────────────────────────────────
// RENDER COURSES — builds the card grid
// ─────────────────────────────────────────
function renderCourses(courses) {
  const grid = document.getElementById('courses-grid');
  const countEl = document.getElementById('results-count');

  // Update count label
  if (countEl) {
    countEl.textContent = `${courses.length} course${courses.length !== 1 ? 's' : ''} found`;
  }

  if (courses.length === 0) {
    grid.innerHTML = `
      <div class="state-box">
        <div class="state-icon">🔍</div>
        <p>No courses match your search. Try different keywords.</p>
      </div>`;
    return;
  }

  grid.innerHTML = courses.map(course => {
    // Check if this user already purchased this course
    const isPurchased = purchasedIds.includes(course.id);

    // Format price: stored in paise, display in rupees
    // e.g. 49900 paise → ₹499
    const priceDisplay = course.price === 0
      ? '<span class="course-price free">FREE</span>'
      : `<span class="course-price">₹${(course.price / 100).toLocaleString('en-IN')}</span>`;

    // Thumbnail: image or emoji fallback
    const thumbnailContent = course.thumbnail_url
      ? `<img src="${course.thumbnail_url}" alt="${course.title}"/>`
      : `<span>🎓</span>`;

    // Badge: purchased vs locked
    const badgeHtml = isPurchased
      ? `<span class="purchased-badge">✅ Enrolled</span>`
      : `<span class="lock-badge">🔒 Locked</span>`;

    return `
      <div class="course-card" onclick="handleCourseClick('${course.id}', ${isPurchased})">

        <div class="course-thumbnail">
          ${thumbnailContent}
          ${badgeHtml}
        </div>

        <div class="course-card-body">
          ${course.teachers?.subject
            ? `<span class="course-subject-tag">${course.teachers.subject}</span>`
            : ''}
          <h3>${course.title}</h3>
          <p>${course.description || 'No description available.'}</p>

          <div class="course-card-footer">
            ${priceDisplay}
            <span class="course-teacher">
              👨‍🏫 ${course.teachers?.name || 'EduPeak Faculty'}
            </span>
          </div>
        </div>

      </div>`;
  }).join('');
}


// ─────────────────────────────────────────
// HANDLE COURSE CARD CLICK
// ─────────────────────────────────────────
function handleCourseClick(courseId, isPurchased) {
  if (isPurchased) {
    // Go to their dashboard to watch
    window.location.href = `dashboard.html?course=${courseId}`;
  } else {
    // Go to course detail / payment page (Step 7)
    window.location.href = `course-detail.html?id=${courseId}`;
  }
}