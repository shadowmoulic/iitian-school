console.log("auth.js loaded");
// ============================================
// auth.js — All Authentication Logic
// Handles: signup, login, logout, session guard
// Uses: window._supabase (set in supabase.js)
// ============================================

// Shorthand so we don't type window._supabase every time
const sb = window._supabase;


// ─────────────────────────────────────────
// HELPER: Show a message below the form
// type = 'error' | 'success'
// ─────────────────────────────────────────
function showMessage(elementId, text, type) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.textContent = text;
  el.className = 'auth-message ' + type; // applies CSS class
}


// ─────────────────────────────────────────
// HELPER: Set button to loading state
// ─────────────────────────────────────────
function setLoading(btnId, isLoading) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  if (isLoading) {
    btn.textContent = 'Please wait...';
    btn.classList.add('btn-loading');
  } else {
    // Restore original text
    btn.textContent = btnId === 'btn-login' ? 'Login to Account' : 'Create Account';
    btn.classList.remove('btn-loading');
  }
}


// ─────────────────────────────────────────
// SIGNUP — Create a new account
// Called by: signup button onclick
// ─────────────────────────────────────────
async function handleSignup() {
  // 1. Read form values
  const name     = document.getElementById('signup-name')?.value.trim();
  const email    = document.getElementById('signup-email')?.value.trim();
  const password = document.getElementById('signup-password')?.value;

  // 2. Basic validation
  if (!name || !email || !password) {
    return showMessage('signup-msg', 'Please fill in all fields.', 'error');
  }
  if (password.length < 6) {
    return showMessage('signup-msg', 'Password must be at least 6 characters.', 'error');
  }

  setLoading('btn-signup', true);

  // 3. Call Supabase Auth
  // signUp() creates the user in Supabase Auth
  // We pass `data: { name }` to store the name in user metadata
  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: {
      data: { name } // stored in auth.users metadata
    }
  });

  setLoading('btn-signup', false);

  if (error) {
    // Supabase returns human-readable error messages
    return showMessage('signup-msg', error.message, 'error');
  }

  // 4. After signup, also insert into our `profiles` table
  // We do this so we can store extra info (role, etc.)
  // data.user.id is the UUID Supabase generated for this user
  if (data.user) {
    try {
      const { error: profileError } = await sb.from('profiles').insert({
        id:    data.user.id,   // must match auth user ID
        name:  name,
        email: email,
        role:  'student'       // default role; admin must be set manually
      });
      
      if (profileError) {
        console.warn('Warning: Could not create user profile. The profiles table may not exist yet.', profileError);
        // Don't fail the signup, just log the warning
      }
    } catch (err) {
      console.warn('Warning: Could not create user profile.', err);
      // Don't fail the signup
    }
  }

  // 5. Success — tell user to check email (Supabase sends confirmation)
  showMessage(
    'signup-msg',
    '✅ Account created! Check your email to confirm, then login.',
    'success'
  );
}


// ─────────────────────────────────────────
// LOGIN — Sign into existing account
// Called by: login button onclick
// ─────────────────────────────────────────
async function handleLogin() {
  const email    = document.getElementById('login-email')?.value.trim();
  const password = document.getElementById('login-password')?.value;

  if (!email || !password) {
    return showMessage('login-msg', 'Please enter your email and password.', 'error');
  }

  setLoading('btn-login', true);

  // signInWithPassword() checks credentials and returns a session
  // The session (JWT) is automatically saved to localStorage by Supabase
  const { data, error } = await sb.auth.signInWithPassword({ email, password });

  setLoading('btn-login', false);

  if (error) {
    return showMessage('login-msg', error.message, 'error');
  }

  // Login success — redirect to dashboard
  window.location.href = 'dashboard.html';
}


// ─────────────────────────────────────────
// LOGOUT — Sign out current user
// Call this from navbar logout button
// ─────────────────────────────────────────
async function handleLogout() {
  await sb.auth.signOut();
  window.location.href = 'index.html';
}


// ─────────────────────────────────────────
// GET CURRENT USER — returns user or null
// Use this on any page to check if logged in
// ─────────────────────────────────────────
async function getCurrentUser() {
  // getSession() reads the saved JWT from localStorage
  const { data: { session } } = await sb.auth.getSession();
  return session ? session.user : null;
}


// ─────────────────────────────────────────
// GUARD: Redirect to login if NOT logged in
// Call this at top of protected pages
// Usage: requireAuth();
// ─────────────────────────────────────────
async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    window.location.href = 'login.html';
  }
  return user; // return user so page can use it
}


// ─────────────────────────────────────────
// GUARD: Redirect to login if NOT an admin
// Call this at top of admin-only pages
// Usage: requireAdmin();
// ─────────────────────────────────────────
async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) {
    window.location.href = 'login.html';
    return null;
  }

  // Fetch role from our profiles table
  try {
    const { data: profile, error: profileError } = await sb
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.warn('Warning: Could not fetch user profile. The profiles table may not exist yet.', profileError);
      alert('Access denied. Admin verification not available.');
      window.location.href = 'index.html';
      return null;
    }

    if (profile.role !== 'admin') {
      alert('Access denied. Admins only.');
      window.location.href = 'index.html';
      return null;
    }
  } catch (err) {
    console.warn('Warning: Could not check admin status.', err);
    alert('Access denied. Admin verification failed.');
    window.location.href = 'index.html';
    return null;
  }

  return user;
}


// ─────────────────────────────────────────
// AUTO NAVBAR UPDATE
// If a page has elements with these IDs,
// this function shows/hides them based on
// whether the user is logged in.
// ─────────────────────────────────────────
// async function updateNavbar() {
//   const user = await getCurrentUser();

//   const guestLinks   = document.getElementById('nav-guest');   // Login/Signup buttons
//   const userLinks    = document.getElementById('nav-user');    // Dashboard/Logout buttons
//   const userNameEl   = document.getElementById('nav-username');// Show user's name

//   if (user) {
//     if (guestLinks)  guestLinks.style.display  = 'none';
//     if (userLinks)   userLinks.style.display   = 'flex';
//     if (userNameEl)  userNameEl.textContent    = user.user_metadata?.name || 'My Account';
//   } else {
//     if (guestLinks)  guestLinks.style.display  = 'flex';
//     if (userLinks)   userLinks.style.display   = 'none';
//   }
// }

async function updateNavbar() {
  const user = await getCurrentUser();

  const guestLinks  = document.getElementById('nav-guest');
  const userLinks   = document.getElementById('nav-user');
  const userNameEl  = document.getElementById('nav-username');
  const adminLink        = document.getElementById('nav-admin');
  const guestLinksMobile  = document.getElementById('nav-guest-mobile');
  const userLinksMobile   = document.getElementById('nav-user-mobile');
  const adminLinkMobile   = document.getElementById('nav-admin-mobile');

  if (user) {
    if (guestLinks) guestLinks.style.display = 'none';
    if (userLinks)  userLinks.style.display  = 'flex';
    if (guestLinksMobile) guestLinksMobile.style.display = 'none';
    if (userLinksMobile)  userLinksMobile.style.display  = 'flex';
    if (userNameEl) userNameEl.textContent   = user.user_metadata?.name || 'My Account';

    if (adminLink) adminLink.style.display = 'inline-block';
    if (adminLinkMobile) adminLinkMobile.style.display = 'inline-block';

    // Check if admin and show admin link
    const { data: profile, error } = await window._supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (error || profile?.role !== 'admin') {
      if (adminLink) adminLink.style.display = 'none';
      if (adminLinkMobile) adminLinkMobile.style.display = 'none';
    }
  } else {
    if (guestLinks) guestLinks.style.display = 'flex';
    if (userLinks)  userLinks.style.display  = 'none';
    if (guestLinksMobile) guestLinksMobile.style.display = 'flex';
    if (userLinksMobile)  userLinksMobile.style.display  = 'none';
    if (adminLink)  adminLink.style.display  = 'none';
    if (adminLinkMobile) adminLinkMobile.style.display = 'none';
  }
}

window.testConnection = async function () {
  console.log("Testing Supabase connection...");

  try {
    const { data, error } = await window._supabase.auth.getSession();

    console.log("Response:", data, error);

    if (error) {
      alert("❌ Connection failed: " + error.message);
    } else {
      alert("✅ Connected to Supabase!");
    }
  } catch (err) {
    console.error("Unexpected error:", err);
    alert("❌ Error. Check console.");
  }
};