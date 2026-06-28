/* =====================================================================
   UI — transport only (play + scrubber + beat ticks). No knobs: the whole
   animation is authored directly in the scene/layer/shader code.
   ===================================================================== */
export function buildUI(host, scene, mount) {
  mount.innerHTML = "";
  const bar = el("div", "studio-bar");
  const play = el("button", "studio-play"); play.innerHTML = "&#9654;";
  const scrub = el("input", "studio-scrub"); scrub.type = "range";
  scrub.min = 0; scrub.max = scene.duration; scrub.step = 0.01; scrub.value = 0;
  const time = el("span", "studio-time");
  bar.append(play, scrub, time);

  const ticks = el("div", "studio-ticks");
  for (const b of scene.timeline.beats) {
    const tk = el("i"); tk.style.left = (b.t / scene.duration * 100) + "%"; ticks.appendChild(tk);
  }
  const wrap = el("div", "studio-barwrap hidden"); wrap.append(bar, ticks);   // scrubber hidden by default
  mount.append(wrap);

  // barely-visible toggle to show/hide the scrubbing player
  const toggle = el("button", "studio-toggle"); toggle.title = "Toggle scrubber";
  toggle.onclick = () => wrap.classList.toggle("hidden");
  mount.append(toggle);

  let scrubbing = false;
  play.onclick = () => host.togglePlay();
  scrub.oninput = () => { scrubbing = true; host.seek(parseFloat(scrub.value)); };
  scrub.onchange = () => { scrubbing = false; };

  const fmt = t => { t = Math.max(0, t); const m = (t / 60) | 0, s = (t % 60) | 0; return m + ":" + (s < 10 ? "0" : "") + s; };
  host.onTime = t => {
    if (!scrubbing) scrub.value = t;
    play.innerHTML = host.playing ? "&#10073;&#10073;" : "&#9654;";
    time.textContent = fmt(t) + " / " + fmt(scene.duration);
  };
  host.onTime(0);
}

function el(tag, cls) { const e = document.createElement(tag); if (cls) e.className = cls; return e; }
