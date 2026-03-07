/**
 * M-Pesa Daraja API configuration and helper utilities.
 *
 * Supported APIs:
 *   - OAuth 2.0 access token
 *   - Lipa Na M-Pesa (STK Push)
 *   - Transaction status query
 */

const axios = require("axios");

const ENV = {
  sandbox:    "https://sandbox.safaricom.co.ke",
  production: "https://api.safaricom.co.ke",
};

const BASE_URL = ENV[process.env.MPESA_ENVIRONMENT] || ENV.sandbox;

/**
 * Fetch a short-lived OAuth access token from Safaricom Daraja.
 * @returns {Promise<string>} bearer token
 */
async function getAccessToken() {
  const key    = process.env.MPESA_CONSUMER_KEY;
  const secret = process.env.MPESA_CONSUMER_SECRET;

  if (!key || !secret) {
    throw new Error("MPESA_CONSUMER_KEY or MPESA_CONSUMER_SECRET not set");
  }

  const credentials = Buffer.from(`${key}:${secret}`).toString("base64");

  const { data } = await axios.get(
    `${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
    { headers: { Authorization: `Basic ${credentials}` } }
  );

  return data.access_token;
}

/**
 * Generate the base64-encoded Lipa Na M-Pesa password.
 * Password = base64(Shortcode + Passkey + Timestamp)
 * @param {string} timestamp - YYYYMMDDHHmmss
 * @returns {string}
 */
function generatePassword(timestamp) {
  const shortcode = process.env.MPESA_SHORTCODE;
  const passkey   = process.env.MPESA_PASSKEY;
  return Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");
}

/**
 * Format the current time as YYYYMMDDHHmmss.
 * @returns {string}
 */
function getTimestamp() {
  return new Date()
    .toISOString()
    .replace(/[-T:.Z]/g, "")
    .slice(0, 14);
}

module.exports = { BASE_URL, getAccessToken, generatePassword, getTimestamp };
