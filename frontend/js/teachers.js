// ============================================
// teachers.js — Loads teachers on homepage
// ============================================

async function loadTeachersOnHomepage() {
  const grid = document.getElementById('teachers-grid');
  if (!grid) return; // only runs if element exists

  const { data: teachers, error } = await window._supabase
    .from('teachers')
    .select('*')
    .order('created_at', { ascending: true });

  if (error || !teachers || teachers.length === 0) {
    grid.innerHTML = `<div style="grid-column:1/-1; text-align:center;
      color:var(--text-muted); padding:48px;">
      No teachers listed yet.
    </div>`;
    return;
  }

  grid.innerHTML = teachers.map(t => `
    <div class="card" style="display:flex; flex-direction:column; align-items:center;
         text-align:center; padding:32px 24px;">

      <!-- Photo or Initial Avatar -->
      ${t.photo_url
        ? `<img src="${t.photo_url}" alt="${t.name}"
               style="width:88px;height:88px;border-radius:50%;
                      object-fit:cover;border:3px solid var(--gold);margin-bottom:16px;"/>`
        : `<div style="width:88px;height:88px;border-radius:50%;
                background:var(--navy);color:white;display:flex;
                align-items:center;justify-content:center;
                font-size:2rem;font-weight:700;
                border:3px solid var(--gold);margin-bottom:16px;">
               ${t.name.charAt(0).toUpperCase()}
           </div>`
      }

      <h3 style="margin-bottom:6px;">${t.name}</h3>

      <span style="display:inline-block;background:#eff6ff;color:#2563eb;
                   padding:3px 12px;border-radius:50px;font-size:0.8rem;
                   font-weight:600;margin-bottom:12px;">
        ${t.subject}
      </span>

      ${t.experience > 0
        ? `<p style="font-size:0.82rem;color:var(--text-muted);margin-bottom:10px;">
             ${t.experience} years experience
           </p>`
        : ''
      }

      ${t.bio
        ? `<p style="font-size:0.88rem;color:var(--text-muted);line-height:1.6;">
             ${t.bio}
           </p>`
        : ''
      }
    </div>
  `).join('');
}

// Run when page loads
loadTeachersOnHomepage();