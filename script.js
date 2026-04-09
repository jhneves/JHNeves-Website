const HEADER_LINKS = [
  { key: "about", label: "Home" },
  { key: "contact", label: "Contact" },
];
const SVG_NS = "http://www.w3.org/2000/svg";
const PLATFORM_ICONS = {
  iphone: {
    viewBox: "0 0 62.771 103.335",
    path: "M13.275 103.335h36.169c7.963 0 13.326-5.053 13.326-12.665V12.665C62.771 5.053 57.407 0 49.444 0H13.275C5.301 0 0 5.053 0 12.665V90.67c0 7.612 5.301 12.665 13.275 12.665Zm1.005-7.842c-4.09 0-6.427-2.183-6.427-6.116V13.959c0-3.933 2.338-6.106 6.427-6.106h6.27c.766 0 1.181.405 1.181 1.173v1.109c.001 2.002 1.35 3.413 3.352 3.413h12.605c2.054 0 3.34-1.411 3.34-3.413v-1.11c0-.766.415-1.171 1.183-1.171h6.228c4.141-.001 6.427 2.172 6.427 6.106v75.417c0 3.933-2.286 6.116-6.427 6.116Zm6.775-3.581h20.712c1.296 0 2.27-.924 2.27-2.282s-.973-2.27-2.269-2.27H21.055c-1.358 0-2.27.912-2.27 2.27s.912 2.282 2.27 2.282Z",
  },
  watch: {
    viewBox: "0 0 70.762 104.469",
    path: "M0 71.965c0 7.57 2.937 13.122 8.492 16.165 2.698 1.442 4.232 3.256 5.26 6.483l1.518 5.26c.934 3.123 3.102 4.597 6.39 4.597h22.554c3.403-.001 5.416-1.423 6.391-4.596l1.58-5.261c.965-3.227 2.552-5.04 5.198-6.483 5.555-3.043 8.492-8.595 8.492-16.165V32.503c0-7.569-2.937-13.122-8.492-16.163-2.646-1.444-4.233-3.257-5.198-6.484l-1.58-5.261C49.733 1.525 47.565 0 44.215 0H21.66c-3.288 0-5.456 1.473-6.39 4.595l-1.518 5.26c-.976 3.177-2.51 5.094-5.26 6.485C2.989 19.226 0 24.83 0 32.503Zm64.824-23.17h1.767c2.499-.001 4.171-1.745 4.171-4.474v-6.626c0-2.78-1.67-4.524-4.171-4.524h-1.767ZM7.129 70.92V33.56c0-7.297 4.261-11.673 11.351-11.673h28.925c7.141 0 11.34 4.376 11.34 11.673v37.36c.001 7.285-4.198 11.66-11.339 11.66H18.48c-7.09.001-11.35-4.374-11.35-11.66Z",
  },
  mac: {
    viewBox: "0 0 140.769 79.424",
    path: "M0 73.887c0 3.049 2.478 5.537 5.475 5.537h129.82c3.038 0 5.475-2.488 5.475-5.537 0-3.09-2.437-5.578-5.475-5.578H124.59v-57.96C124.59 3.52 120.956 0 114.136 0H26.633c-6.457 0-10.452 3.52-10.452 10.35v57.958H5.475C2.478 68.309 0 70.797 0 73.887Zm24.086-5.578V12.585c0-3.161 1.529-4.742 4.7-4.742h83.198c3.171 0 4.751 1.58 4.751 4.742V68.31ZM55.65 7.843h1.244c.728 0 1.143.363 1.143 1.183v.591c0 2.003 1.286 3.413 3.392 3.413h18.036c1.992 0 3.289-1.41 3.289-3.413v-.591c0-.82.415-1.183 1.183-1.183h1.246v-4.02H55.649Z",
  },
  tv: {
    viewBox: "0 0 122.045 97.575",
    path: "M12.523 81.04h97c8.227 0 12.521-4.307 12.521-12.524V12.575C122.045 4.305 117.75 0 109.522 0h-97C4.296 0 0 4.306 0 12.575v55.942c0 8.217 4.295 12.522 12.523 12.522ZM36.49 97.574h49.065a3.93 3.93 0 0 0 3.937-3.914c0-2.249-1.74-3.979-3.937-3.979H36.49c-2.197-.001-3.937 1.729-3.937 3.978a3.93 3.93 0 0 0 3.937 3.916ZM12.658 73.186c-3.172 0-4.805-1.622-4.805-4.794V12.699c0-3.224 1.633-4.845 4.805-4.845h96.73c3.17 0 4.802 1.621 4.802 4.845v55.693c.001 3.172-1.63 4.794-4.803 4.794Z",
  },
  ipad: {
    viewBox: "0 0 16.68 22.021",
    path: "M5.39 19.688h5.538a.436.436 0 0 0 .459-.46c0-.273-.186-.449-.46-.449H5.392c-.264 0-.45.176-.45.45 0 .273.186.459.45.459ZM0 19.424c0 1.543 1.084 2.578 2.705 2.578h10.908c1.621 0 2.705-1.035 2.705-2.578V2.588C16.318 1.045 15.234 0 13.613 0H2.705C1.084 0 0 1.045 0 2.588Zm1.572-.264V2.852c0-.801.489-1.28 1.328-1.28h10.518c.83 0 1.328.479 1.328 1.28V19.16c0 .8-.498 1.27-1.328 1.27H2.9c-.84 0-1.328-.47-1.328-1.27Z",
  },
};

const headerRoot = document.querySelector("[data-site-header]");

function currentFileName() {
  const path = window.location.pathname;
  const fileName = path.split("/").pop();
  return fileName || "index.html";
}

function navHref(key, isHomePage) {
  if (key === "contact") {
    return "mailto:jhneves@me.com";
  }

  return "index.html";
}

function renderHeader() {
  if (!headerRoot) {
    return;
  }

  const isHomePage = currentFileName() === "index.html";
  const activeNav = document.body.dataset.nav || "about";

  const linksMarkup = HEADER_LINKS.map(({ key, label }) => {
    const isActive = activeNav === key ? ' class="is-active"' : "";
    return `<a${isActive} href="${navHref(key, isHomePage)}">${label}</a>`;
  }).join("");

  headerRoot.innerHTML = `
    <div class="shell topbar">
      <a class="brand" href="index.html" aria-label="João Neves home">
        <span class="brand-accent">JOÃO</span>
        <span>NEVES</span>
      </a>
      <nav class="nav-links" aria-label="Primary">
        ${linksMarkup}
      </nav>
    </div>
  `;
}

function syncHeaderOffset() {
  if (!headerRoot) {
    return;
  }

  const offset = `${headerRoot.offsetHeight}px`;
  document.documentElement.style.setProperty("--header-offset", offset);
}

function inlinePlatformIcons() {
  const useElements = document.querySelectorAll('use[href^="assets/platform-icons.svg#"]');

  for (const useElement of useElements) {
    const href = useElement.getAttribute("href");
    if (!href) {
      continue;
    }

    const iconId = href.split("#")[1];
    const icon = PLATFORM_ICONS[iconId];
    const svg = useElement.ownerSVGElement;

    if (!icon || !svg) {
      continue;
    }

    svg.setAttribute("viewBox", icon.viewBox);
    svg.innerHTML = "";

    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("d", icon.path);
    path.setAttribute("fill", "currentColor");
    svg.appendChild(path);
  }
}

renderHeader();
syncHeaderOffset();
inlinePlatformIcons();

if (headerRoot) {
  new ResizeObserver(syncHeaderOffset).observe(headerRoot);
}

window.addEventListener("load", syncHeaderOffset, { once: true });
window.addEventListener("resize", syncHeaderOffset);
