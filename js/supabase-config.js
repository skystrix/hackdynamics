/* ==========================================================================
   supabase-config.js — your Supabase project's public settings.

   1. Create a project at https://supabase.com
   2. Project Settings → API → copy "Project URL" and the "anon / public" key
   3. Paste them below (both are safe to expose in the browser — the anon key
      is designed for client use and is protected by Row Level Security).
   4. Run the SQL in SUPABASE_SETUP.md to create the profiles table + policies.

   Until real values are filled in, the login page and the course pages show
   a "not configured yet" notice instead of erroring.
   ========================================================================== */
window.HD_CONFIG = {
  SUPABASE_URL: "https://gfmeewpztjxhuemrymzi.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmbWVld3B6dGp4aHVlbXJ5bXppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM3NzcwNDcsImV4cCI6MjA5OTM1MzA0N30.NocvsJPmlUAhth_ZhYqrtUMuVI0vqeGIWyCaUkAOsSM",

  // Where to send people after they log in, and which page is the default course.
  COURSE_URL: "databases-in-depth.html",
  // Where a signed-in member is sent to pick a course (the catalogue), as
  // opposed to COURSE_URL, which is one specific course page.
  COURSES_URL: "courses.html",
  LOGIN_URL: "login.html",

  // Razorpay Checkout — the Key ID is the ONLY Razorpay value that belongs in
  // browser code (it's public, like the anon key). The Key Secret and the
  // webhook secret never appear here; see MANUAL_ACTIONS.md PART C.
  RAZORPAY_KEY_ID: "rzp_test_TWpsPg24h4cp4b"
};

window.HD_CONFIG.isConfigured = function () {
  var c = window.HD_CONFIG;
  return c.SUPABASE_URL.indexOf("YOUR-PROJECT") === -1 &&
         c.SUPABASE_ANON_KEY.indexOf("YOUR-ANON") === -1;
};
