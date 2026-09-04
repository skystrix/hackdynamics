/* ==========================================================================
   supabase-config.js — your Supabase project's public settings.

   1. Create a project at https://supabase.com
   2. Project Settings → API → copy "Project URL" and the "anon / public" key
   3. Paste them below (both are safe to expose in the browser — the anon key
      is designed for client use and is protected by Row Level Security).
   4. Run the SQL in SUPABASE_SETUP.md to create the profiles table + policies.

   Until real values are filled in, the login page and the course paywall show
   a "not configured yet" notice instead of erroring.
   ========================================================================== */
window.HD_CONFIG = {
  SUPABASE_URL: "https://gfmeewpztjxhuemrymzi.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmbWVld3B6dGp4aHVlbXJ5bXppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM3NzcwNDcsImV4cCI6MjA5OTM1MzA0N30.NocvsJPmlUAhth_ZhYqrtUMuVI0vqeGIWyCaUkAOsSM",

  // Where to send people after they log in, and which page is the paid course.
  COURSE_URL: "databases-in-depth.html",
  LOGIN_URL: "login.html",
  PRICING_URL: "pricing.html",

  // Razorpay Checkout — the Key ID is the ONLY Razorpay value that belongs in
  // browser code (it's public, like the anon key). The Key Secret and the
  // webhook secret never appear here; see MANUAL_ACTIONS.md PART C.
  RAZORPAY_KEY_ID: "rzp_test_TWpsPg24h4cp4b",

  // The two plans. DISPLAY ONLY — what a member is actually charged comes from
  // the server: the monthly amount lives in the Razorpay Plan you created
  // (RAZORPAY_PLAN_ID_MONTHLY), the one-year amount in YEARLY_PAISE in
  // supabase/functions/razorpay-checkout/index.ts. Editing these labels in
  // devtools changes the wording, never the price. Keep them in sync by hand.
  // `was` is the anchor price shown struck through — marketing only.
  PLANS: {
    monthly: {
      label: "₹499 / month",
      price: "₹499",
      was: "₹999",
      per: "/ month",
      note: "Billed monthly in INR. Cancel anytime."
    },
    yearly: {
      label: "₹2499 for 1 year",
      price: "₹2499",
      was: "₹5988",
      per: "/ year",
      note: "One payment in INR. Covers 12 months."
    }
  }
};

window.HD_CONFIG.isConfigured = function () {
  var c = window.HD_CONFIG;
  return c.SUPABASE_URL.indexOf("YOUR-PROJECT") === -1 &&
         c.SUPABASE_ANON_KEY.indexOf("YOUR-ANON") === -1;
};
