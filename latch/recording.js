(() => {
  const videos = [...document.querySelectorAll("[data-recording]")];
  if (videos.length === 0) return;

  const darkMode = matchMedia("(prefers-color-scheme: dark)");
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const visibility = new WeakMap();
  const resetting = new WeakSet();

  function bounds(video) {
    const requestedStart = Number(video.dataset.start || 0);
    const start = Number.isFinite(requestedStart)
      ? Math.max(0, Math.min(requestedStart, Math.max(0, video.duration - 0.1)))
      : 0;
    const requestedEnd = Number(video.dataset.end || 0);
    const end = Number.isFinite(requestedEnd) && requestedEnd > start
      ? Math.min(requestedEnd, video.duration)
      : video.duration;
    return { start, end };
  }

  function selectedValue(video, name) {
    const appearance = darkMode.matches ? "dark" : "light";
    return video.dataset[`${appearance}${name}`];
  }

  function configure(video) {
    const poster = selectedValue(video, "Poster");
    if (poster) video.poster = poster;

    if (reducedMotion.matches) {
      video.pause();
      video.removeAttribute("src");
      video.load();
      return;
    }

    const source = selectedValue(video, "Src");
    if (!source || video.dataset.activeSource === source) return;

    video.dataset.activeSource = source;
    video.src = source;
    video.load();
  }

  function play(video) {
    if (reducedMotion.matches || !visibility.get(video)) return;

    const seekAndPlay = () => {
      const { start, end } = bounds(video);
      if (video.currentTime < start || video.currentTime >= end - 0.04 || video.ended) {
        video.currentTime = start;
      }
      video.play().catch(() => {});
    };

    if (video.readyState >= 1) {
      seekAndPlay();
    } else {
      video.addEventListener("loadedmetadata", seekAndPlay, { once: true });
    }
  }

  function restart(video) {
    if (resetting.has(video) || !video.hasAttribute("data-loop")) return;

    resetting.add(video);
    video.pause();
    video.classList.add("is-loop-resetting");

    window.setTimeout(() => {
      const { start } = bounds(video);
      video.currentTime = start;

      const reveal = () => {
        requestAnimationFrame(() => {
          video.classList.remove("is-loop-resetting");
          resetting.delete(video);
          play(video);
        });
      };

      if (video.readyState >= 2) {
        reveal();
      } else {
        video.addEventListener("seeked", reveal, { once: true });
      }
    }, 150);
  }

  videos.forEach((video) => {
    video.addEventListener("ended", () => restart(video));
    video.addEventListener("timeupdate", () => {
      if (!video.hasAttribute("data-loop") || !Number.isFinite(video.duration)) return;
      const { end } = bounds(video);
      if (video.currentTime >= end - 0.08) restart(video);
    });
    configure(video);
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const video = entry.target;
      visibility.set(video, entry.isIntersecting);
      if (entry.isIntersecting) {
        play(video);
      } else {
        video.pause();
      }
    });
  }, { threshold: 0.18 });

  videos.forEach((video) => observer.observe(video));

  function refresh() {
    videos.forEach((video) => {
      video.dataset.activeSource = "";
      configure(video);
      play(video);
    });
  }

  darkMode.addEventListener("change", refresh);
  reducedMotion.addEventListener("change", refresh);
})();
