/**
 * Services Controller
 * CRUD operations for service listings stored in Firestore /services collection.
 *
 * Endpoints:
 *   POST   /api/services              – create a service (provider only)
 *   GET    /api/services              – list/search services (public)
 *   GET    /api/services/:id          – get a single service (public)
 *   PUT    /api/services/:id          – update a service (owner only)
 *   DELETE /api/services/:id          – delete a service (owner only)
 */

const { db } = require("../config/firebase");
const { v4: uuidv4 } = require("uuid");

/**
 * POST /api/services
 * Body: { title, description, price, priceUnit, category, location, imageURL? }
 */
async function createService(req, res) {
  const { title, description, price, priceUnit = "fixed", category, location, imageURL = "" } = req.body;

  if (!title || !description || !price || !category || !location) {
    return res.status(400).json({ error: "title, description, price, category and location are required" });
  }

  try {
    const id      = uuidv4();
    const service = {
      id,
      providerId:   req.user.uid,
      title,
      description,
      price:        Number(price),
      priceUnit,
      category,
      location,
      imageURL,
      rating:       0,
      reviewCount:  0,
      isActive:     true,
      createdAt:    new Date().toISOString(),
      updatedAt:    new Date().toISOString(),
    };

    await db.collection("services").doc(id).set(service);

    return res.status(201).json({ message: "Service created", service });
  } catch (err) {
    console.error("[createService]", err);
    return res.status(500).json({ error: "Could not create service" });
  }
}

/**
 * GET /api/services
 * Query params: category, location, minPrice, maxPrice, minRating, search, limit, offset
 */
async function getServices(req, res) {
  const { category, location, minPrice, maxPrice, minRating, search, limit = 20, offset = 0 } = req.query;

  try {
    let query = db.collection("services").where("isActive", "==", true);

    if (category) query = query.where("category", "==", category);

    // Firestore doesn't support full-text search; fetch and filter client-side
    const snapshot = await query.orderBy("createdAt", "desc").limit(200).get();

    let services = snapshot.docs.map((d) => d.data());

    if (location) {
      const loc = location.toLowerCase();
      services = services.filter((s) => s.location.toLowerCase().includes(loc));
    }
    if (search) {
      const term = search.toLowerCase();
      services = services.filter(
        (s) => s.title.toLowerCase().includes(term) || s.description.toLowerCase().includes(term)
      );
    }
    if (minPrice) services = services.filter((s) => s.price >= Number(minPrice));
    if (maxPrice) services = services.filter((s) => s.price <= Number(maxPrice));
    if (minRating) services = services.filter((s) => s.rating >= Number(minRating));

    const total   = services.length;
    const paged   = services.slice(Number(offset), Number(offset) + Number(limit));

    return res.status(200).json({ total, offset: Number(offset), limit: Number(limit), services: paged });
  } catch (err) {
    console.error("[getServices]", err);
    return res.status(500).json({ error: "Could not retrieve services" });
  }
}

/**
 * GET /api/services/:id
 */
async function getService(req, res) {
  try {
    const snap = await db.collection("services").doc(req.params.id).get();
    if (!snap.exists) return res.status(404).json({ error: "Service not found" });
    return res.status(200).json(snap.data());
  } catch (err) {
    console.error("[getService]", err);
    return res.status(500).json({ error: "Could not retrieve service" });
  }
}

/**
 * PUT /api/services/:id
 * Body: { title?, description?, price?, priceUnit?, category?, location?, imageURL?, isActive? }
 */
async function updateService(req, res) {
  try {
    const snap = await db.collection("services").doc(req.params.id).get();
    if (!snap.exists) return res.status(404).json({ error: "Service not found" });

    if (snap.data().providerId !== req.user.uid) {
      return res.status(403).json({ error: "You can only update your own services" });
    }

    const allowed  = ["title", "description", "price", "priceUnit", "category", "location", "imageURL", "isActive"];
    const updates  = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    updates.updatedAt = new Date().toISOString();

    await db.collection("services").doc(req.params.id).update(updates);

    return res.status(200).json({ message: "Service updated", id: req.params.id, updates });
  } catch (err) {
    console.error("[updateService]", err);
    return res.status(500).json({ error: "Could not update service" });
  }
}

/**
 * DELETE /api/services/:id  (soft delete – sets isActive: false)
 */
async function deleteService(req, res) {
  try {
    const snap = await db.collection("services").doc(req.params.id).get();
    if (!snap.exists) return res.status(404).json({ error: "Service not found" });

    if (snap.data().providerId !== req.user.uid) {
      return res.status(403).json({ error: "You can only delete your own services" });
    }

    await db.collection("services").doc(req.params.id).update({
      isActive:  false,
      updatedAt: new Date().toISOString(),
    });

    return res.status(200).json({ message: "Service deleted" });
  } catch (err) {
    console.error("[deleteService]", err);
    return res.status(500).json({ error: "Could not delete service" });
  }
}

module.exports = { createService, getServices, getService, updateService, deleteService };
