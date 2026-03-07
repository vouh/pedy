// ─────────────────────────────────────────────────────────────────────────────
// auth-ui.js  –  Injects the auth modal into any page & manages nav state
// Usage:  import { initAuth, openAuthModal } from "./js/auth-ui.js";
//         initAuth();   // call once on page load
// ─────────────────────────────────────────────────────────────────────────────
import { signUp, signIn, signInWithGoogle, logOut, onAuthChange, getUserProfile } from "./auth.js";

// ── Modal HTML template ──────────────────────────────────────────────────────
const MODAL_HTML = `
<div id="auth-modal" class="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm hidden" role="dialog" aria-modal="true">
  <div class="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">

    <!-- Tab bar -->
    <div class="border-b border-slate-200 dark:border-slate-800 flex">
      <button id="tab-login"
        class="auth-tab flex-1 py-4 text-sm font-bold border-b-2 border-primary text-primary transition-colors">
        Sign In
      </button>
      <button id="tab-signup"
        class="auth-tab flex-1 py-4 text-sm font-bold border-b-2 border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
        Create Account
      </button>
    </div>

    <!-- ── Login form ─────────────────────────────────────────────── -->
    <div id="form-login" class="p-8">
      <h2 class="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">Welcome back</h2>
      <p class="text-slate-500 text-sm mb-6">Sign in to your PEDY account</p>

      <!-- Google sign-in -->
      <button type="button" id="google-login-btn"
        class="w-full flex items-center justify-center gap-3 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 transition-colors mb-4">
        <svg class="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Continue with Google
      </button>

      <div class="flex items-center gap-3 mb-4">
        <div class="flex-1 h-px bg-slate-200 dark:bg-slate-700"></div>
        <span class="text-xs text-slate-400 font-medium">or</span>
        <div class="flex-1 h-px bg-slate-200 dark:bg-slate-700"></div>
      </div>

      <form id="login-form" class="space-y-4" novalidate>
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
          <input id="login-email" type="email" required autocomplete="email"
            placeholder="you@example.com"
            class="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"/>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
          <input id="login-password" type="password" required autocomplete="current-password"
            placeholder="••••••••"
            class="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"/>
        </div>

        <div id="login-error" class="hidden text-sm text-red-700 bg-red-50 rounded-lg px-4 py-2.5 border border-red-200"></div>

        <button type="submit" id="login-btn"
          class="w-full bg-primary hover:bg-primary/90 active:bg-primary/80 text-white font-bold py-3 rounded-lg transition-all">
          Sign In
        </button>
      </form>

      <p class="text-center text-sm text-slate-500 mt-6">
        No account?
        <button id="switch-to-signup" class="text-primary font-bold hover:underline ml-1">Sign up free</button>
      </p>
    </div>

    <!-- ── Sign-up form ───────────────────────────────────────────── -->
    <div id="form-signup" class="p-8 hidden">
      <h2 class="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">Join PEDY</h2>
      <p class="text-slate-500 text-sm mb-6">Create your free account today</p>

      <!-- Google sign-up -->
      <button type="button" id="google-signup-btn"
        class="w-full flex items-center justify-center gap-3 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 transition-colors mb-4">
        <svg class="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Continue with Google
      </button>

      <div class="flex items-center gap-3 mb-4">
        <div class="flex-1 h-px bg-slate-200 dark:bg-slate-700"></div>
        <span class="text-xs text-slate-400 font-medium">or</span>
        <div class="flex-1 h-px bg-slate-200 dark:bg-slate-700"></div>
      </div>

      <form id="signup-form" class="space-y-4" novalidate>
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
          <input id="signup-name" type="text" required autocomplete="name"
            placeholder="Your full name"
            class="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"/>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
          <input id="signup-email" type="email" required autocomplete="email"
            placeholder="you@example.com"
            class="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"/>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
          <input id="signup-password" type="password" required autocomplete="new-password"
            placeholder="Min. 6 characters" minlength="6"
            class="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"/>
        </div>

        <!-- Provider toggle -->
        <label class="flex items-start gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-primary transition-colors">
          <input id="signup-is-provider" type="checkbox"
            class="mt-0.5 rounded text-primary focus:ring-primary h-4 w-4"/>
          <div>
            <span class="block text-sm font-semibold text-slate-900 dark:text-slate-100">Register as a Service Provider</span>
            <span class="text-xs text-slate-500">Create a profile, list services and earn money</span>
          </div>
        </label>

        <div id="signup-error" class="hidden text-sm text-red-700 bg-red-50 rounded-lg px-4 py-2.5 border border-red-200"></div>

        <button type="submit" id="signup-btn"
          class="w-full bg-primary hover:bg-primary/90 active:bg-primary/80 text-white font-bold py-3 rounded-lg transition-all">
          Create Account
        </button>
      </form>

      <p class="text-center text-sm text-slate-500 mt-6">
        Already have an account?
        <button id="switch-to-login" class="text-primary font-bold hover:underline ml-1">Sign in</button>
      </p>
    </div>

    <!-- Close button -->
    <button id="close-auth-modal"
      class="absolute top-3 right-3 size-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-800 transition-colors"
      aria-label="Close">
      <span class="material-symbols-outlined !text-xl">close</span>
    </button>
  </div>
</div>`;

// ── Internal state ───────────────────────────────────────────────────────────
let _currentUser    = null;
let _userProfile    = null;
let _onAuthCallback = null;

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Initialise auth UI on a page.
 * @param {Object} options
 * @param {Function} [options.onAuthChange]  Called with (user, profile) on state change
 * @param {boolean}  [options.requireAuth]   Redirect to index.html if not signed in
 */
export function initAuth(options = {}) {
  // Inject modal
  document.body.insertAdjacentHTML("beforeend", MODAL_HTML);
  _setupModalListeners();
  _setupNavListeners();

  _onAuthCallback = options.onAuthChange || null;

  onAuthChange(async (user) => {
    _currentUser = user;
    if (user) {
      _userProfile = await getUserProfile(user.uid);
    } else {
      _userProfile = null;
      if (options.requireAuth) {
        window.location.href = "index.html";
        return;
      }
    }
    _updateNavUI(user, _userProfile);
    _onAuthCallback?.(user, _userProfile);
  });
}

export function openAuthModal(tab = "login") {
  const modal = document.getElementById("auth-modal");
  if (!modal) return;
  modal.classList.remove("hidden");
  if (tab === "signup") {
    document.getElementById("tab-signup")?.click();
  } else {
    document.getElementById("tab-login")?.click();
  }
}

export function closeAuthModal() {
  document.getElementById("auth-modal")?.classList.add("hidden");
}

export const getCurrentUser    = () => _currentUser;
export const getUserProfileData = () => _userProfile;

// ── Private helpers ──────────────────────────────────────────────────────────

function _updateNavUI(user, profile) {
  const signInBtn  = document.getElementById("nav-sign-in-btn");
  const userMenu   = document.getElementById("nav-user-menu");
  const userName   = document.getElementById("nav-user-name");
  const userInitial = document.getElementById("nav-user-initial");

  if (!signInBtn) return;

  if (user) {
    signInBtn.classList.add("hidden");
    if (userMenu) {
      userMenu.classList.remove("hidden");
      if (userName)    userName.textContent    = user.displayName || user.email.split("@")[0];
      if (userInitial) userInitial.textContent = (user.displayName || user.email)[0].toUpperCase();
    }
    // Show provider-only nav items
    if (profile?.role === "provider") {
      document.querySelectorAll(".provider-only").forEach(el => el.classList.remove("hidden"));
    }
  } else {
    signInBtn.classList.remove("hidden");
    if (userMenu) userMenu.classList.add("hidden");
    document.querySelectorAll(".provider-only").forEach(el => el.classList.add("hidden"));
  }
}

function _setupNavListeners() {
  // Sign-in button opens modal
  document.getElementById("nav-sign-in-btn")?.addEventListener("click", () => openAuthModal("login"));

  // Sign-up button (on some pages)
  document.getElementById("nav-sign-up-btn")?.addEventListener("click", () => openAuthModal("signup"));

  // Sign-out
  document.getElementById("nav-sign-out-btn")?.addEventListener("click", async () => {
    await logOut();
    window.location.href = "index.html";
  });

  // Dashboard link
  document.getElementById("nav-dashboard-btn")?.addEventListener("click", () => {
    window.location.href = "dashboard.html";
  });
}

function _setupModalListeners() {
  const modal       = document.getElementById("auth-modal");
  const tabLogin    = document.getElementById("tab-login");
  const tabSignup   = document.getElementById("tab-signup");
  const formLogin   = document.getElementById("form-login");
  const formSignup  = document.getElementById("form-signup");
  const closeBtn    = document.getElementById("close-auth-modal");

  const showLogin = () => {
    formLogin.classList.remove("hidden");
    formSignup.classList.add("hidden");
    tabLogin.classList.add("border-primary", "text-primary");
    tabLogin.classList.remove("border-transparent", "text-slate-500");
    tabSignup.classList.remove("border-primary", "text-primary");
    tabSignup.classList.add("border-transparent", "text-slate-500");
  };

  const showSignup = () => {
    formSignup.classList.remove("hidden");
    formLogin.classList.add("hidden");
    tabSignup.classList.add("border-primary", "text-primary");
    tabSignup.classList.remove("border-transparent", "text-slate-500");
    tabLogin.classList.remove("border-primary", "text-primary");
    tabLogin.classList.add("border-transparent", "text-slate-500");
  };

  tabLogin?.addEventListener("click",  showLogin);
  tabSignup?.addEventListener("click", showSignup);
  document.getElementById("switch-to-signup")?.addEventListener("click", showSignup);
  document.getElementById("switch-to-login")?.addEventListener("click",  showLogin);

  closeBtn?.addEventListener("click", closeAuthModal);
  modal?.addEventListener("click", e => { if (e.target === modal) closeAuthModal(); });

  // ── Google sign-in (login tab) ─────────────────────────────────────────────
  document.getElementById("google-login-btn")?.addEventListener("click", async () => {
    const btn = document.getElementById("google-login-btn");
    const errEl = document.getElementById("login-error");
    btn.textContent = "Signing in…";
    btn.disabled    = true;
    errEl.classList.add("hidden");
    try {
      await signInWithGoogle(false);
      closeAuthModal();
    } catch (err) {
      if (err.code !== "auth/popup-closed-by-user" && err.code !== "auth/cancelled-popup-request") {
        errEl.textContent = _friendlyError(err.message);
        errEl.classList.remove("hidden");
      }
    } finally {
      btn.innerHTML = `<svg class="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg> Continue with Google`;
      btn.disabled = false;
    }
  });

  // ── Google sign-up (signup tab) ────────────────────────────────────────────
  document.getElementById("google-signup-btn")?.addEventListener("click", async () => {
    const btn        = document.getElementById("google-signup-btn");
    const errEl      = document.getElementById("signup-error");
    const isProvider = document.getElementById("signup-is-provider")?.checked || false;
    btn.textContent = "Signing in…";
    btn.disabled    = true;
    errEl.classList.add("hidden");
    try {
      await signInWithGoogle(isProvider);
      closeAuthModal();
      if (isProvider) window.location.href = "dashboard.html";
    } catch (err) {
      if (err.code !== "auth/popup-closed-by-user" && err.code !== "auth/cancelled-popup-request") {
        errEl.textContent = _friendlyError(err.message);
        errEl.classList.remove("hidden");
      }
    } finally {
      btn.innerHTML = `<svg class="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg> Continue with Google`;
      btn.disabled = false;
    }
  });

  // ── Login submit ───────────────────────────────────────────────────────────
  document.getElementById("login-form")?.addEventListener("submit", async e => {
    e.preventDefault();
    const btn   = document.getElementById("login-btn");
    const errEl = document.getElementById("login-error");
    const email    = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;

    btn.textContent = "Signing in…";
    btn.disabled    = true;
    errEl.classList.add("hidden");

    try {
      await signIn(email, password);
      closeAuthModal();
    } catch (err) {
      errEl.textContent = _friendlyError(err.message);
      errEl.classList.remove("hidden");
    } finally {
      btn.textContent = "Sign In";
      btn.disabled    = false;
    }
  });

  // ── Sign-up submit ─────────────────────────────────────────────────────────
  document.getElementById("signup-form")?.addEventListener("submit", async e => {
    e.preventDefault();
    const btn   = document.getElementById("signup-btn");
    const errEl = document.getElementById("signup-error");
    const name       = document.getElementById("signup-name").value.trim();
    const email      = document.getElementById("signup-email").value.trim();
    const password   = document.getElementById("signup-password").value;
    const isProvider = document.getElementById("signup-is-provider").checked;

    btn.textContent = "Creating account…";
    btn.disabled    = true;
    errEl.classList.add("hidden");

    try {
      await signUp(email, password, name, isProvider);
      closeAuthModal();
      if (isProvider) window.location.href = "dashboard.html";
    } catch (err) {
      errEl.textContent = _friendlyError(err.message);
      errEl.classList.remove("hidden");
    } finally {
      btn.textContent = "Create Account";
      btn.disabled    = false;
    }
  });
}

function _friendlyError(msg) {
  return msg
    .replace("Firebase: ", "")
    .replace(/\(auth\/[^)]+\)\.?/, "")
    .trim() || "Something went wrong. Please try again.";
}
