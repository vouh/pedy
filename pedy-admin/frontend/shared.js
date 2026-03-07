// ─── API Configuration ───────────────────────────────────────────────────────
const API_BASE = "http://localhost:4000/api/admin";

/**
 * Authenticated fetch wrapper – attaches JWT from sessionStorage.
 */
async function apiFetch(path, options = {}) {
  const token = sessionStorage.getItem("pedy_token");
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
  sessionStorage.removeItem("pedy_admin");
  sessionStorage.removeItem("pedy_token");
  window.location.href = "index.html";
}

// ─── Role Permissions ────────────────────────────────────────────────────────
const PERMISSIONS = {
  super_admin: [
    "dashboard",
    "users",
    "services",
    "payments",
    "reviews",
    "notifications",
    "bookings",
    "settings",
    "analytics",
    "admins",
    "auditlog",
  ],
  content_moderator: [
    "dashboard",
    "users",
    "services",
    "reviews",
    "notifications",
    "bookings",
    "analytics",
  ],
  payment_manager: ["dashboard", "payments", "analytics"],
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

// ─── Navigation Sections ─────────────────────────────────────────────────────
const NAV_SECTIONS = [
  {
    label: "Overview",
    items: [
      {
        id: "dashboard",
        label: "Dashboard",
        icon: "grid_view",
        href: "dashboard.html",
      },
      {
        id: "analytics",
        label: "Analytics",
        icon: "bar_chart",
        href: "analytics.html",
      },
    ],
  },
  {
    label: "Marketplace",
    items: [
      { id: "users", label: "Users", icon: "group", href: "users.html" },
      {
        id: "services",
        label: "Services",
        icon: "storefront",
        href: "services.html",
      },
      {
        id: "bookings",
        label: "Bookings",
        icon: "calendar_month",
        href: "bookings.html",
      },
      {
        id: "reviews",
        label: "Reviews",
        icon: "reviews",
        href: "reviews.html",
      },
    ],
  },
  {
    label: "Operations",
    items: [
      {
        id: "payments",
        label: "Payments",
        icon: "account_balance",
        href: "payments.html",
      },
      {
        id: "notifications",
        label: "Notifications",
        icon: "notifications",
        href: "notifications.html",
      },
    ],
  },
  {
    label: "Administration",
    items: [
      {
        id: "admins",
        label: "Admin Accounts",
        icon: "admin_panel_settings",
        href: "admins.html",
      },
      {
        id: "settings",
        label: "Settings",
        icon: "settings",
        href: "settings.html",
      },
      {
        id: "auditlog",
        label: "Audit Log",
        icon: "history",
        href: "auditlog.html",
      },
    ],
  },
];

function buildSidebar(user, activePage) {
  const meta = ROLE_META[user.role];

  const navHTML = NAV_SECTIONS.map((section) => {
    const itemsHTML = section.items
      .map((item) => {
        const allowed = can(user, item.id);
        const active = item.id === activePage;
        if (!allowed)
          return `
        <div class="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 dark:text-slate-600 cursor-not-allowed select-none text-sm">
          <span class="material-symbols-outlined !text-base">${item.icon}</span>
          <span>${item.label}</span>
          <span class="ml-auto material-symbols-outlined !text-xs">lock</span>
        </div>`;
        return `
        <a href="${item.href}" class="${
          active
            ? "flex items-center gap-3 px-3 py-2 rounded-lg bg-primary text-white font-semibold shadow-sm text-sm"
            : "flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-sm font-medium"
        }">
          <span class="material-symbols-outlined !text-base">${item.icon}</span>
          <span>${item.label}</span>
          <span id="badge-${item.id}" class="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary hidden"></span>
        </a>`;
      })
      .join("");
    return `
      <div class="mb-3">
        <p class="px-3 mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">${section.label}</p>
        ${itemsHTML}
      </div>`;
  }).join("");

  return `
  <aside id="sidebar"
    class="pedy-sidebar flex flex-col w-64 h-screen bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 fixed top-0 left-0 z-40 transition-transform duration-300">
    <!-- Logo -->
    <div class="flex-shrink-0 flex items-center gap-3 px-6 py-4 border-b border-slate-100 dark:border-slate-700">
      <img src="assets/images/logo_no_bg.png" alt="Pedy Logo" width="36" height="36" style="width:36px;height:36px;min-width:36px;min-height:36px;max-width:36px;max-height:36px;" class="rounded-lg object-contain flex-shrink-0" />
      <div>
        <h1 class="text-base font-bold leading-none">PEDY</h1>
        <p class="text-[10px] font-semibold text-primary uppercase tracking-widest mt-0.5">Admin Panel</p>
      </div>
    </div>

    <!-- Role Badge -->
    <div class="flex-shrink-0 px-4 py-3 border-b border-slate-100 dark:border-slate-700">
      <div class="flex items-center gap-2 px-3 py-2 rounded-lg ${meta.bg} border ${meta.border}">
        <span class="material-symbols-outlined !text-base ${meta.color}">${meta.icon}</span>
        <span class="text-xs font-semibold ${meta.color}">${meta.label}</span>
      </div>
    </div>

    <!-- Nav (scrollable, hidden scrollbar) -->
    <nav class="flex-1 px-3 py-3 overflow-y-auto pedy-hide-scrollbar">
      ${navHTML}
    </nav>

    <!-- User + Logout -->
    <div class="flex-shrink-0 px-4 py-4 border-t border-slate-100 dark:border-slate-700">
      <div class="flex items-center gap-3 mb-3">
        <div class="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">${user.name.charAt(0)}</div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-semibold truncate">${user.name}</p>
          <p class="text-xs text-slate-400 truncate">${user.email || ""}</p>
        </div>
      </div>
      <button onclick="logout()"
        class="w-full flex items-center gap-2 justify-center py-2 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-primary hover:text-primary transition-colors text-sm font-medium">
        <span class="material-symbols-outlined !text-base">logout</span>Sign Out
      </button>
    </div>
  </aside>
  <div id="sidebarOverlay" onclick="toggleSidebar()" class="hidden fixed inset-0 bg-black/40 z-30 lg:hidden"></div>`;
}

function buildTopbar(title, subtitle) {
  return `
  <header class="pedy-topbar sticky top-0 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur border-b border-slate-200 dark:border-slate-700 px-6 py-3 flex items-center gap-4">
    <button onclick="toggleSidebar()" class="lg:hidden flex items-center justify-center size-9 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500">
      <span class="material-symbols-outlined">menu</span>
    </button>
    <div class="flex-1">
      <h2 class="text-lg font-bold leading-none">${title}</h2>
      ${subtitle ? `<p class="text-xs text-slate-400 mt-0.5">${subtitle}</p>` : ""}
    </div>
    <!-- Global Search -->
    <div class="hidden sm:flex items-center">
      <label class="relative">
        <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 !text-base pointer-events-none">search</span>
        <input id="globalSearch" type="text" placeholder="Search users, services..." onkeydown="handleGlobalSearch(event)"
          class="bg-slate-100 dark:bg-slate-800 border-none rounded-lg py-2 pl-9 pr-4 text-sm w-52 focus:w-72 focus:ring-2 focus:ring-primary/40 outline-none transition-all duration-300"/>
      </label>
    </div>
    <!-- Dark mode toggle -->
    <button onclick="toggleDarkMode()" id="darkBtn"
      class="flex items-center justify-center size-9 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-300 hover:border-primary hover:text-primary transition-colors">
      <span id="darkIcon" class="material-symbols-outlined !text-base">dark_mode</span>
    </button>
  </header>`;
}

// ─── Dark Mode ────────────────────────────────────────────────────────────────
function initDarkMode() {
  // Dark class is already applied by the inline <script> in each page's <head>
  // before first paint — nothing to do except sync the icon.
  updateDarkIcon();
}

function toggleDarkMode() {
  document.documentElement.classList.add("dark-transitioning");
  document.documentElement.classList.toggle("dark");
  localStorage.setItem(
    "pedy_theme",
    document.documentElement.classList.contains("dark") ? "dark" : "light",
  );
  updateDarkIcon();
  setTimeout(
    () => document.documentElement.classList.remove("dark-transitioning"),
    350,
  );
}

function updateDarkIcon() {
  const icon = document.getElementById("darkIcon");
  if (!icon) return;
  icon.textContent = document.documentElement.classList.contains("dark")
    ? "light_mode"
    : "dark_mode";
}

// ─── Global Search ─────────────────────────────────────────────────────────────
function handleGlobalSearch(e) {
  if (e.key !== "Enter") return;
  const q = e.target.value.trim();
  if (!q) return;
  const page = window.location.pathname.includes("services")
    ? "services"
    : "users";
  window.location.href = `${page}.html?q=${encodeURIComponent(q)}`;
}

// ─── Pagination Helper ────────────────────────────────────────────────────────
function createPagination(total, page, pageSize, onPageChange) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return "";
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1))
      pages.push(i);
    else if (pages[pages.length - 1] !== "...") pages.push("...");
  }
  const start = Math.min((page - 1) * pageSize + 1, total);
  const end = Math.min(page * pageSize, total);
  const prevDis = page === 1 ? "disabled" : "";
  const nextDis = page === totalPages ? "disabled" : "";
  const pagesHtml = pages
    .map((p) =>
      p === "..."
        ? `<span class="px-1 text-slate-400 text-sm">…</span>`
        : `<button onclick="(${onPageChange})(${p})"
           class="size-8 flex items-center justify-center rounded-lg text-sm font-semibold transition-colors ${p === page ? "bg-primary text-white" : "border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"}">${p}</button>`,
    )
    .join("");
  return `
    <div class="flex items-center justify-between mt-4 px-1">
      <p class="text-xs text-slate-400">Showing ${start}–${end} of ${total}</p>
      <nav class="flex items-center gap-1">
        <button onclick="(${onPageChange})(${page - 1})" ${prevDis}
          class="size-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm">
          <span class="material-symbols-outlined !text-sm">chevron_left</span></button>
        ${pagesHtml}
        <button onclick="(${onPageChange})(${page + 1})" ${nextDis}
          class="size-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm">
          <span class="material-symbols-outlined !text-sm">chevron_right</span></button>
      </nav>
    </div>`;
}

// ─── CSV Export Helper ────────────────────────────────────────────────────────
function exportCSV(filename, headers, rows) {
  const csv = [
    headers.join(","),
    ...rows.map((r) =>
      r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","),
    ),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

// ─── PDF Export Helper ────────────────────────────────────────────────────────
/**
 * exportPDF(filename, title, headers, rows, options?)
 *   filename : "users.pdf"
 *   title    : "Users Report"  — printed at the top of the PDF
 *   headers  : ["ID","Name","Email", ...]
 *   rows     : [[1,"Alice","a@b.com"], ...]
 *   options  : { orientation, columnStyles, subtitle }
 */
function exportPDF(filename, title, headers, rows, options = {}) {
  const { jsPDF } = window.jspdf;
  const orientation =
    options.orientation || (headers.length > 5 ? "landscape" : "portrait");
  const doc = new jsPDF({ orientation, unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();

  // ── Brand header ──
  doc.setFillColor(230, 57, 70); // PEDY red
  doc.rect(0, 0, pageW, 18, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text("PEDY Admin", 14, 12);

  // ── Title ──
  doc.setTextColor(21, 14, 14);
  doc.setFontSize(16);
  doc.text(title, 14, 30);

  // ── Subtitle / meta ──
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  const subtitle =
    options.subtitle ||
    `Generated ${new Date().toLocaleString()} · ${rows.length} records`;
  doc.text(subtitle, 14, 36);

  // ── Table ──
  doc.autoTable({
    startY: 42,
    head: [headers],
    body: rows.map((r) => r.map((v) => String(v ?? ""))),
    theme: "grid",
    headStyles: {
      fillColor: [230, 57, 70],
      textColor: 255,
      fontStyle: "bold",
      fontSize: 8,
      halign: "left",
    },
    bodyStyles: { fontSize: 7.5, textColor: [50, 50, 50] },
    alternateRowStyles: { fillColor: [248, 246, 246] },
    styles: { cellPadding: 2.5, lineColor: [220, 220, 220], lineWidth: 0.2 },
    margin: { left: 14, right: 14 },
    columnStyles: options.columnStyles || {},
    didDrawPage: function (data) {
      // Footer on every page
      const pageH = doc.internal.pageSize.getHeight();
      doc.setFontSize(7);
      doc.setTextColor(160, 160, 160);
      doc.text(
        `Page ${doc.internal.getNumberOfPages()} · PEDY Admin`,
        pageW / 2,
        pageH - 8,
        { align: "center" },
      );
    },
  });

  doc.save(filename);
}

// ─── Export Dropdown Toggle ──────────────────────────────────────────────────
function toggleExportMenu(id) {
  const menu = document.getElementById(id);
  // Close any other open menus
  document.querySelectorAll(".pedy-export-menu").forEach((m) => {
    if (m.id !== id) m.classList.add("hidden");
  });
  menu.classList.toggle("hidden");
}

// Close export menus when clicking outside
document.addEventListener("click", function (e) {
  if (!e.target.closest(".pedy-export-wrap")) {
    document
      .querySelectorAll(".pedy-export-menu")
      .forEach((m) => m.classList.add("hidden"));
  }
});

function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebarOverlay");
  sidebar.classList.toggle("-translate-x-full");
  overlay.classList.toggle("hidden");
}

// ─── Init ─────────────────────────────────────────────────────────────────────
function initLayout() {
  initDarkMode();
  const sidebar = document.getElementById("sidebar");
  if (sidebar && window.innerWidth < 1024)
    sidebar.classList.add("-translate-x-full");
}
window.addEventListener("DOMContentLoaded", initLayout);
