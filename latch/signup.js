(() => {
  const dialog = document.querySelector("#latch-download-dialog");
  const form = document.querySelector("#latch-download-form");
  const email = document.querySelector("#latch-download-email");
  const button = form?.querySelector("button[type='submit']");
  const status = form?.querySelector("[role='status']");
  const honeypot = form?.querySelector("input[name='website']");
  const close = dialog?.querySelector(".download-close");
  const triggers = document.querySelectorAll("[data-latch-download]");

  if (!dialog || !form || !email || !button || !status || !close || !triggers.length) return;

  const openDialog = () => {
    status.textContent = "";
    dialog.showModal();
    email.focus();
  };

  triggers.forEach((trigger) => trigger.addEventListener("click", openDialog));
  close.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!email.checkValidity()) {
      email.reportValidity();
      return;
    }

    email.disabled = true;
    button.disabled = true;
    status.textContent = "Preparing download…";

    try {
      const response = await fetch("/api/latch-download", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: email.value.trim(),
          website: honeypot?.value || "",
        }),
      });

      const result = await response.json();
      if (!response.ok || !result?.downloadUrl?.startsWith("/api/latch-download/")) {
        throw new Error("download failed");
      }

      const download = document.createElement("a");
      download.href = result.downloadUrl;
      document.body.append(download);
      download.click();
      download.remove();

      status.textContent = "Download started.";
      button.textContent = "Download again";
    } catch {
      status.textContent = "Couldn’t start the download. Please try again.";
    } finally {
      email.disabled = false;
      button.disabled = false;
    }
  });
})();
