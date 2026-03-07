const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

/**
 * In production replace this with Supabase / DB queries.
 * Passwords are bcrypt hashes of the demo values.
 */
const ADMIN_ACCOUNTS = [
  {
    id: 1,
    name: "Super Admin",
    email: "superadmin@pedy.com",
    // plaintext: super123
    passwordHash:
      "$2a$10$ajwxOQBVMt7OHqM81medt.cetE9h9Q2lISc9PXIM/8xxOMGYmgUIG",
    role: "super_admin",
  },
  {
    id: 2,
    name: "Content Moderator",
    email: "moderator@pedy.com",
    // plaintext: mod123
    passwordHash:
      "$2a$10$m7RF9ohSopcYL0JSs2DPf.P8xwCH665Cd1AxCwPKsrViXniEBvfDO",
    role: "content_moderator",
  },
  {
    id: 3,
    name: "Payment Manager",
    email: "payments@pedy.com",
    // plaintext: pay123
    passwordHash:
      "$2a$10$d45Pu5j5HJzY4vw/7oXUFOfjyaN0W/fgLXtNVGBEQKvLfWMLF9Rpu",
    role: "payment_manager",
  },
];

/**
 * POST /api/admin/auth/login
 * Body: { email, password }
 * Returns: { token, admin: { id, name, email, role } }
 */
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const admin = ADMIN_ACCOUNTS.find(
    (a) => a.email === email.toLowerCase().trim(),
  );
  if (!admin) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const valid = await bcrypt.compare(password, admin.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign(
    { id: admin.id, email: admin.email, name: admin.name, role: admin.role },
    process.env.JWT_SECRET,
    { expiresIn: "8h" },
  );

  res.json({
    token,
    admin: {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
    },
  });
});

/**
 * GET /api/admin/auth/me
 * Returns the current admin's info from the JWT.
 */
const { authenticate } = require("../middleware/rbac");

router.get("/me", authenticate, (req, res) => {
  res.json({ admin: req.admin });
});

module.exports = router;
