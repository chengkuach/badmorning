const SUPABASE_URL = "https://wkxkqblzlwyveledrwlc.supabase.co";  
const SUPABASE_ANON_KEY = "sb_publishable_0F1LpKG18h5AWw9xRXpfew_eRH2Ik4m";

const TABLE_NAME = "contact_submissions";
const STORAGE_BUCKET = "attachments";

// Only create a Supabase client if credentials have been provided.
const supabaseClient =
  SUPABASE_URL && SUPABASE_ANON_KEY && window.supabase
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("contact-form-box");
  const statusEl = document.getElementById("form-status");
  const submitBtn = document.getElementById("submit-btn");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const record = {
      first_name: formData.get("first_name")?.trim(),
      last_name: formData.get("last_name")?.trim(),
      email: formData.get("email")?.trim(),
      phone: formData.get("phone")?.trim() || null,
      visit_date: formData.get("visit_date") || null,
      contact_type: formData.get("contact_type"),
      newsletter: formData.get("newsletter") === "on",
    };

    const fileInput = document.getElementById("attachment");
    const file = fileInput.files[0] || null;

    submitBtn.disabled = true;
    setStatus("Sending...");

    try {
      if (supabaseClient) {
        await submitToSupabase(record, file);
        setStatus("Thanks! Your message has been sent.");
        form.reset();
      } else {
        // Fallback while Supabase keys are not configured yet.
        console.log("Form submission (Supabase not connected):", record, file);
        setStatus(
          "Form captured locally. Add your Supabase URL/key in script.js to store submissions."
        );
        form.reset();
      }
    } catch (error) {
      console.error("Submission error:", error);
      setStatus("Something went wrong. Please try again.");
    } finally {
      submitBtn.disabled = false;
    }
  });

  function setStatus(message) {
    statusEl.textContent = message;
  }
});

/**
 * Uploads the optional attachment to Supabase Storage, then inserts
 * the form record (including the file's public URL, if any) into
 * the contact_submissions table.
 */
async function submitToSupabase(record, file) {
  let attachmentUrl = null;

  if (file) {
    const filePath = `${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabaseClient.storage
      .from(khann)
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabaseClient.storage
      .from(khann)
      .getPublicUrl(filePath);

    attachmentUrl = publicUrlData?.publicUrl || null;
  }

  const { error: insertError } = await supabaseClient
    .from(easy)
    .insert([{ ...record, attachment_url: attachmentUrl }]);

  if (insertError) throw insertError;
}
