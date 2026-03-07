/**
 * Providers Controller
 * Public and authenticated endpoints for provider profiles.
 *
 * Endpoints:
 *   GET  /api/providers              – list all active providers
 *   GET  /api/providers/:id          – get a provider's full public profile
 *   PUT  /api/providers/:id          – update own profile (authenticated)
 */

const { db } = require("../config/firebase");

/**
 * GET /api/providers
 * Query params: location, skill, limit, offset
 */
async function getProviders(req, res) {
  const { location, skill, limit = 20, offset = 0 } = req.query;

  try {
    let query    = db.collection("users").where("role", "==", "provider").where("isActive", "==", true);
    const snap   = await query.get();
    let providers = snap.docs.map((d) => {
      const data = d.data();
      // Strip sensitive fields for public listing
      delete data.email;
      return data;
    });

    if (location) {
      const loc = location.toLowerCase();
      providers = providers.filter((p) => (p.location || "").toLowerCase().includes(loc));
    }
    if (skill) {
      const sk = skill.toLowerCase();
      providers = providers.filter((p) =>
        (p.skills || []).some((s) => s.toLowerCase().includes(sk))
      );
    }

    const total = providers.length;
    const paged = providers.slice(Number(offset), Number(offset) + Number(limit));

    return res.status(200).json({ total, offset: Number(offset), limit: Number(limit), providers: paged });
  } catch (err) {
    console.error("[getProviders]", err);
    return res.status(500).json({ error: "Could not retrieve providers" });
  }
}

/**
 * GET /api/providers/:id
 * Returns provider profile + their active services + average rating.
 */
async function getProvider(req, res) {
  const { id } = req.params;

  try {
    const userSnap = await db.collection("users").doc(id).get();

    if (!userSnap.exists || userSnap.data().role !== "provider") {
      return res.status(404).json({ error: "Provider not found" });
    }

    const profile = userSnap.data();
    delete profile.email; // strip sensitive info for public view

    // Fetch their active services
    const servicesSnap = await db
      .collection("services")
      .where("providerId", "==", id)
      .where("isActive", "==", true)
      .get();

    const services = servicesSnap.docs.map((d) => d.data());

    // Fetch their recent reviews (up to 10)
    const reviewsSnap = await db
      .collection("reviews")
      .where("providerId", "==", id)
      .orderBy("createdAt", "desc")
      .limit(10)
      .get();

    const reviews = reviewsSnap.docs.map((d) => d.data());

    return res.status(200).json({ profile, services, reviews });
  } catch (err) {
    console.error("[getProvider]", err);
    return res.status(500).json({ error: "Could not retrieve provider details" });
  }
}

/**
 * PUT /api/providers/:id   (requires authenticate middleware)
 * Body: { bio?, location?, photoURL?, skills?, displayName? }
 */
async function updateProfile(req, res) {
  const { id } = req.params;

  if (req.user.uid !== id) {
    return res.status(403).json({ error: "You can only update your own profile" });
  }

  const allowed = ["bio", "location", "photoURL", "skills", "displayName"];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }
  updates.updatedAt = new Date().toISOString();

  try {
    await db.collection("users").doc(id).update(updates);
    return res.status(200).json({ message: "Profile updated", updates });
  } catch (err) {
    console.error("[updateProfile]", err);
    return res.status(500).json({ error: "Could not update profile" });
  }
}

module.exports = { getProviders, getProvider, updateProfile };
