// ─── API Configuration ───────────────────────────────────────────────────────
const API_BASE = "http://localhost:4000/api/admin";

/**
 * Authenticated fetch wrapper.
 * Prefers window.getCurrentIdToken() (provided by firebase-admin-init.js) so
 * that the Firebase ID token is always fresh.  Falls back to sessionStorage.
 */
async function apiFetch(path, options = {}) {
  let token;
  if (typeof window.getCurrentIdToken === "function") {
    token = await window.getCurrentIdToken();
  } else {
    token = sessionStorage.getItem("pedy_token");
  }

  const res = await fetch(API_BASE + path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: "Bearer " + token } : {}),
      ...(options.headers || {}),
    },
  });
  if (res.status === 401) {
    logout();
    return null;
  }
  return res;
}

// ─── Auth Guard ─────────────────────────────────────────────────────────────
function requireAuth() {
  const raw = sessionStorage.getItem("pedy_admin");
  if (!raw) {
    window.location.href = "index.html";
    return null;
  }
  return JSON.parse(raw);
}

function logout() {
  if (typeof window.firebaseSignOut === "function") {
    window.firebaseSignOut(); // handles Firebase sign-out + sessionStorage clear
  } else {
    sessionStorage.removeItem("pedy_admin");
    sessionStorage.removeItem("pedy_token");
    window.location.href = "index.html";
  }
}

// ─── Role Permissions ────────────────────────────────────────────────────────
const PERMISSIONS = {
  super_admin: ["dashboard", "users", "services", "payments"],
  content_moderator: ["dashboard", "users", "services"],
  payment_manager: ["dashboard", "payments"],
};

const ROLE_META = {
  super_admin: {
    label: "Super Admin",
    color: "text-primary",
    bg: "bg-red-50 dark:bg-red-900/30",
    border: "border-primary/30",
    icon: "shield",
  },
  content_moderator: {
    label: "Content Moderator",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-900/30",
    border: "border-blue-300 dark:border-blue-700",
    icon: "manage_accounts",
  },
  payment_manager: {
    label: "Payment Manager",
    color: "text-green-700 dark:text-green-400",
    bg: "bg-green-50 dark:bg-green-900/30",
    border: "border-green-300 dark:border-green-700",
    icon: "payments",
  },
};

function can(user, page) {
  return PERMISSIONS[user.role]?.includes(page) ?? false;
}

// ─── Sidebar Builder ─────────────────────────────────────────────────────────
const NAV_ITEMS = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: "grid_view",
    href: "dashboard.html",
  },
  { id: "users", label: "Users", icon: "group", href: "users.html" },
  {
    id: "services",
    label: "Services",
    icon: "storefront",
    href: "services.html",
  },
  {
    id: "payments",
    label: "Payments",
    icon: "account_balance",
    href: "payments.html",
  },
];

function buildSidebar(user, activePage) {
  const meta = ROLE_META[user.role];
  return `
  <aside id="sidebar"
    class="flex flex-col w-64 min-h-screen bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 fixed top-0 left-0 z-40 transition-transform duration-300">
    <!-- Logo -->
    <div class="flex items-center gap-3 px-6 py-5 border-b border-slate-100 dark:border-slate-700">
      <div class="size-9 bg-primary rounded-lg flex items-center justify-center text-white shadow-md shadow-primary/30">
        <span class="material-symbols-outlined !text-xl filled">diamond</span>
      </div>
      <div>
        <h1 class="text-base font-bold leading-none">PEDY</h1>
        <p class="text-[10px] font-semibold text-primary uppercase tracking-widest mt-0.5">Admin Panel</p>
      </div>
    </div>

    <!-- Role Badge -->
    <div class="px-4 py-4 border-b border-slate-100 dark:border-slate-700">
      <div class="flex items-center gap-2 px-3 py-2 rounded-lg ${meta.bg} border ${meta.border}">
        <span class="material-symbols-outlined !text-base ${meta.color}">${meta.icon}</span>
        <span class="text-xs font-semibold ${meta.color}">${meta.label}</span>
      </div>
    </div>

    <!-- Nav -->
    <nav class="flex-1 px-3 py-4 space-y-1">
      ${NAV_ITEMS.map((item) => {
        const allowed = can(user, item.id);
        const active = item.id === activePage;
        if (!allowed)
          return `
          <div class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 dark:text-slate-600 cursor-not-allowed select-none">
            <span class="material-symbols-outlined !text-lg">${item.icon}</span>
            <span class="text-sm font-medium">${item.label}</span>
            <span class="ml-auto material-symbols-outlined !text-sm">lock</span>
          </div>`;
        return `
          <a href="${item.href}" class="${
            active
              ? "flex items-center gap-3 px-3 py-2.5 rounded-lg bg-primary text-white font-semibold shadow-sm"
              : "flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors font-medium"
          }">
            <span class="material-symbols-outlined !text-lg ${active ? "" : ""}">${item.icon}</span>
            <span class="text-sm">${item.label}</span>
          </a>`;
      }).join("")}
    </nav>

    <!-- User info + Logout -->
    <div class="px-4 py-4 border-t border-slate-100 dark:border-slate-700">
      <div class="flex items-center gap-3 mb-3">
        <div class="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
          ${user.name.charAt(0)}
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-semibold truncate">${user.name}</p>
          <p class="text-xs text-slate-400 truncate">${user.email || ""}</p>
        </div>
      </div>
      <button onclick="logout()"
        class="w-full flex items-center gap-2 justify-center py-2 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-primary hover:text-primary transition-colors text-sm font-medium">
        <span class="material-symbols-outlined !text-base">logout</span>
        Sign Out
      </button>
    </div>
  </aside>
  <!-- Mobile overlay -->
  <div id="sidebarOverlay" onclick="toggleSidebar()" class="hidden fixed inset-0 bg-black/40 z-30 lg:hidden"></div>`;
}

function buildTopbar(title, subtitle) {
  return `
  <header class="sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center gap-4">
    <button onclick="toggleSidebar()" class="lg:hidden flex items-center justify-center size-9 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500">
      <span class="material-symbols-outlined">menu</span>
    </button>
    <div class="flex-1">
      <h2 class="text-lg font-bold leading-none">${title}</h2>
      ${subtitle ? `<p class="text-xs text-slate-400 mt-0.5">${subtitle}</p>` : ""}
    </div>
  </header>`;
}

function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebarOverlay");
  sidebar.classList.toggle("-translate-x-full");
  overlay.classList.toggle("hidden");
}

// Init sidebar on mobile (hidden by default)
function initLayout() {
  const sidebar = document.getElementById("sidebar");
  if (window.innerWidth < 1024) sidebar.classList.add("-translate-x-full");
}
window.addEventListener("DOMContentLoaded", initLayout);
