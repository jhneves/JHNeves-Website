/* =====================================================================
   INTRO — JOIN-first flow. On load the brand (logo + icons) sits over the
   idle grid with a JOIN button. Pressing JOIN reveals the email field (types
   "what's your email?") AND ignites the build animation. A valid address
   submits to the waitlist ("On the list"), any time during or after the show.
   When the animation finishes, the brand logo reappears as a bookend.
   ===================================================================== */
import { CrtOff } from "./crt.js";

export function setupIntro(host, els) {
  const { stage, joinForm, email, joinBtn, hint, sound } = els;
  const crt = new CrtOff(document.getElementById("crtfx"));

  joinForm.classList.add("show");   // JOIN is live from the first frame (no "Hello" gate)

  // sound toggle
  if (sound) {
    let muted = false;
    sound.addEventListener("click", e => { e.stopPropagation(); muted = !muted; sound.classList.toggle("off", muted); host.audio.muted = muted; });
  }

  // Our own caret (so it can be 2px + amber) tracks the end of the centre-aligned text via a
  // hidden measurer that mirrors the input's font.
  const caret = joinForm.querySelector(".caret");
  const meas = document.createElement("span");
  meas.setAttribute("aria-hidden", "true");
  meas.style.cssText = "position:absolute;left:-9999px;top:-9999px;white-space:pre;visibility:hidden;";
  joinForm.appendChild(meas);
  let measSynced = false;
  const placeCaret = () => {
    if (!measSynced) { const c = getComputedStyle(email); meas.style.fontFamily = c.fontFamily; meas.style.fontSize = c.fontSize; meas.style.fontWeight = c.fontWeight; meas.style.letterSpacing = c.letterSpacing; measSynced = true; }
    meas.textContent = email.value || "";
    caret.style.transform = `translate(calc(-50% + ${meas.offsetWidth / 2}px), -50%)`;
  };

  // The join form re-arms cleanly whenever we leave the finale (e.g. scrubbing back).
  let revealed = false, joined = false, typeTimer = null;
  const QUESTION = "what’s your email?";
  const stopType = () => { clearTimeout(typeTimer); typeTimer = null; };
  const refresh = () => joinForm.classList.toggle("valid", email.checkValidity() && email.value.trim().length > 3);
  const resetJoin = () => {
    revealed = false; joined = false; stopType();
    cancelAnimationFrame(crt.raf); crt.raf = 0; crt.clear();   // kill any in-flight power-off
    joinForm.classList.remove("revealed", "qdim", "ready", "valid", "done", "hidden");
    email.value = ""; email.placeholder = ""; caret.style.transform = "translate(-50%, -50%)";
    hint.className = "join-ok hidden"; hint.textContent = "";
  };

  // Type the prompt out fast, then leave "what's your email?" sitting as a dimmed, resting
  // placeholder (the field is already focused from the JOIN tap, amber caret blinking).
  const askEmail = () => {
    stopType(); email.placeholder = ""; joinForm.classList.remove("qdim"); let i = 0;
    const type = () => {
      i++; email.placeholder = QUESTION.slice(0, i) + (i < QUESTION.length ? "|" : "");
      if (i < QUESTION.length) { typeTimer = setTimeout(type, 22 + Math.random() * 24); return; }
      joinForm.classList.add("qdim", "ready"); placeCaret();     // settle: dim the question, blink the caret
    };
    typeTimer = setTimeout(type, 200);   // a beat after the field starts fading in
  };

  // DEV: drop straight into a ready, pre-filled state (used by ?join) so the CRT animation
  // can be replayed with a single Enter/click — no reveal, no typing.
  const prefillJoin = (addr = "you@example.com") => {
    stopType();
    revealed = true; joined = false;
    joinForm.classList.add("show", "revealed", "ready");
    joinForm.classList.remove("qdim", "done", "hidden");
    email.placeholder = ""; email.value = addr;
    placeCaret(); refresh(); email.focus();
  };

  // teaser credits: each line surfaces during its [t0,t1] window of the build (deterministic on
  // scene time, so it scrubs correctly), then clears before the finale.
  const teaserLines = [...document.querySelectorAll(".teaser p")];
  const reveal = document.querySelector(".reveal");
  const updateTeaser = (t, on) => {
    for (const el of teaserLines) {
      const t0 = +el.dataset.t0, t1 = +el.dataset.t1;
      el.classList.toggle("on", on && t >= t0 && t < t1);                 // punch in on t0
      el.classList.toggle("leaving", on && t >= t1 && t < t1 + 0.55);     // punch out on t1
    }
  };

  // Brand bookend: the logo shows at the hero (idle) and again when the build finishes, and
  // fades away while the animation plays. JOIN / email / "On the list" persist throughout.
  let revealShown = null;
  host.onFrame = () => {
    const s = host.scene;
    updateTeaser(s.t, host.started);
    const atFinale = host.started && s.t >= s.fadeStartT && s.mapFade < 0.12;
    stage.classList.toggle("fading", atFinale);              // black out at the very end
    const showReveal = !host.started || atFinale;
    if (showReveal !== revealShown) {
      revealShown = showReveal;
      if (reveal) reveal.classList.toggle("show", showReveal);
    }
  };

  // Press JOIN -> the email field fades in + types its prompt AND the build animation ignites.
  // Focus synchronously inside the tap so iOS/Android open the keyboard and desktop can type at once.
  joinBtn.addEventListener("click", e => {
    if (!revealed) {
      e.preventDefault(); revealed = true; joinForm.classList.add("revealed");
      email.focus({ preventScroll: true });
      askEmail();
      if (!host.started) host.begin();                       // signing up starts the show
    }
  });
  // a valid address turns JOIN full colour; Enter or the lit JOIN submits. caret tracks the text.
  email.addEventListener("input", () => {
    if (!joinForm.classList.contains("ready")) {           // typed before the prompt settled -> jump to ready
      stopType(); email.placeholder = QUESTION; joinForm.classList.add("qdim", "ready");
    }
    placeCaret(); refresh();
  });
  joinForm.addEventListener("submit", e => {
    e.preventDefault();
    if (joined) return;
    const v = (email.value || "").trim();
    if (!email.checkValidity() || v.length < 4) { email.focus(); return; }   // quietly insist on a real address
    joined = true; stopType(); email.blur();
    // capture the signup to our own Cloudflare KV (via the Pages Function at /api/waitlist).
    fetch("/api/waitlist", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: v }),
    }).catch(() => {});                                   // fail soft: a network hiccup never breaks the animation
    joinForm.classList.add("done");                       // dissolve the HTML content fast...
    // ...and centre + size the collapse exactly on the JOIN button (1 unit == viewport height)
    const br = joinBtn.getBoundingClientRect();
    crt.centerY = (br.top + br.bottom) / 2 / innerHeight;
    crt.halfW = (br.width / 2) / innerHeight;
    crt.halfH = (br.height / 2) / innerHeight;
    crt.play();                                            // WebGL CRT power-off does the glowing collapse
    setTimeout(() => {                                    // once it has winked, the confirmation rises
      joinForm.classList.add("hidden");
      hint.className = "join-ok"; hint.textContent = "On the list";
    }, 600);
  });

  return { prefillJoin };
}
