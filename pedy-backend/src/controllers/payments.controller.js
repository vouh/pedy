/**
 * Payments Controller – M-Pesa Daraja API Integration
 *
 * Endpoints:
 *   POST /api/payments/stk-push          – initiate STK Push payment
 *   POST /api/payments/callback          – M-Pesa result callback (public, no auth)
 *   GET  /api/payments/status/:checkoutId – query transaction status
 */

const axios             = require("axios");
const { db }           = require("../config/firebase");
const { v4: uuidv4 }   = require("uuid");
const mpesa            = require("../config/mpesa");

/**
 * POST /api/payments/stk-push
 * Body: { phone, amount, bookingId, accountRef? }
 *
 * `phone` format: 254XXXXXXXXX (Safaricom number without + or 0)
 */
async function initiateSTKPush(req, res) {
  let { phone, amount, bookingId, accountRef = "PEDY" } = req.body;

  if (!phone || !amount || !bookingId) {
    return res.status(400).json({ error: "phone, amount and bookingId are required" });
  }

  // Normalise phone: 07XXXXXXXX → 2547XXXXXXXX
  phone = String(phone).replace(/^\+/, "").replace(/^0/, "254");

  try {
    const token     = await mpesa.getAccessToken();
    const timestamp = mpesa.getTimestamp();
    const password  = mpesa.generatePassword(timestamp);
    const shortcode = process.env.MPESA_SHORTCODE;
    const callbackURL = `${process.env.MPESA_CALLBACK_BASE_URL}/api/payments/callback`;

    const payload = {
      BusinessShortCode: shortcode,
      Password:          password,
      Timestamp:         timestamp,
      TransactionType:   "CustomerPayBillOnline",
      Amount:            Math.ceil(Number(amount)),
      PartyA:            phone,
      PartyB:            shortcode,
      PhoneNumber:       phone,
      CallBackURL:       callbackURL,
      AccountReference:  accountRef,
      TransactionDesc:   `PEDY booking ${bookingId}`,
    };

    const { data } = await axios.post(
      `${mpesa.BASE_URL}/mpesa/stkpush/v1/processrequest`,
      payload,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (data.ResponseCode !== "0") {
      return res.status(400).json({ error: data.ResponseDescription });
    }

    // Persist a pending payment record
    const paymentId = uuidv4();
    const payment   = {
      id:            paymentId,
      bookingId,
      clientId:      req.user.uid,
      phone,
      amount:        Math.ceil(Number(amount)),
      checkoutRequestId: data.CheckoutRequestID,
      merchantRequestId: data.MerchantRequestID,
      status:        "pending",
      method:        "mpesa",
      createdAt:     new Date().toISOString(),
      updatedAt:     new Date().toISOString(),
    };

    await db.collection("payments").doc(paymentId).set(payment);

    return res.status(200).json({
      message:           "STK Push sent – check your phone",
      checkoutRequestId: data.CheckoutRequestID,
      paymentId,
    });
  } catch (err) {
    console.error("[initiateSTKPush]", err?.response?.data || err.message);
    return res.status(500).json({ error: "M-Pesa STK Push failed. Please try again." });
  }
}

/**
 * POST /api/payments/callback
 * Safaricom posts the payment result here.  No auth required.
 */
async function mpesaCallback(req, res) {
  try {
    const body    = req.body?.Body?.stkCallback;
    if (!body) return res.status(200).json({ message: "OK" }); // acknowledge

    const checkoutId = body.CheckoutRequestID;
    const resultCode = body.ResultCode;           // 0 = success
    const resultDesc = body.ResultDescription;

    // Find the matching payment record
    const snap = await db
      .collection("payments")
      .where("checkoutRequestId", "==", checkoutId)
      .limit(1)
      .get();

    if (snap.empty) {
      console.warn("[mpesaCallback] No matching payment for", checkoutId);
      return res.status(200).json({ message: "OK" });
    }

    const payDoc    = snap.docs[0];
    const paymentId = payDoc.id;
    const bookingId = payDoc.data().bookingId;

    if (resultCode === 0) {
      // Extract MPesa receipt number from callbackMetadata
      const items  = body.CallbackMetadata?.Item || [];
      const receipt = items.find((i) => i.Name === "MpesaReceiptNumber")?.Value || "";
      const amount  = items.find((i) => i.Name === "Amount")?.Value || payDoc.data().amount;

      await db.collection("payments").doc(paymentId).update({
        status:        "success",
        mpesaReceipt:  receipt,
        amount,
        resultDesc,
        updatedAt: new Date().toISOString(),
      });

      // Mark the related booking as paid
      if (bookingId) {
        await db.collection("bookings").doc(bookingId).update({
          paymentStatus: "paid",
          paymentId,
          updatedAt:     new Date().toISOString(),
        });
      }
    } else {
      await db.collection("payments").doc(paymentId).update({
        status:     "failed",
        resultDesc,
        updatedAt:  new Date().toISOString(),
      });
    }

    return res.status(200).json({ message: "OK" });
  } catch (err) {
    console.error("[mpesaCallback]", err);
    return res.status(200).json({ message: "OK" }); // always 200 to Safaricom
  }
}

/**
 * GET /api/payments/status/:checkoutId
 */
async function queryPaymentStatus(req, res) {
  try {
    const snap = await db
      .collection("payments")
      .where("checkoutRequestId", "==", req.params.checkoutId)
      .limit(1)
      .get();

    if (snap.empty) {
      return res.status(404).json({ error: "Payment record not found" });
    }

    const data = snap.docs[0].data();
    if (data.clientId !== req.user.uid) {
      return res.status(403).json({ error: "Access denied" });
    }

    return res.status(200).json({ status: data.status, payment: data });
  } catch (err) {
    console.error("[queryPaymentStatus]", err);
    return res.status(500).json({ error: "Could not retrieve payment status" });
  }
}

module.exports = { initiateSTKPush, mpesaCallback, queryPaymentStatus };
