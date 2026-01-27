let portfolioData = null;
let currentLang = "en";
let currentFilter = "all";
let searchQuery = "";

const i18n = {
  en: {
    nav_about: "Bio",
    nav_skills: "Skills",
    nav_lang: "Languages",
    nav_exp: "Experience",
    nav_proj: "Vault",
    about: "Biography",
    skills: "Skill Tree",
    languages: "Communication",
    exp: "Career History",
    proj: "Project Vault",
    search_placeholder: "Search project database...",
    see_more: "Details",
  },
  es: {
    nav_about: "Bio",
    nav_skills: "Skills",
    nav_lang: "Idiomas",
    nav_exp: "Exp",
    nav_proj: "Bóveda",
    about: "Biografía",
    skills: "Árbol de Habilidades",
    languages: "Comunicación",
    exp: "Trayectoria Profesional",
    proj: "Bóveda de Proyectos",
    search_placeholder: "Buscar base de datos...",
    see_more: "Detalles",
  },
};

// VISIBILITY OBSERVER: Unlocks sections when scrolling
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
      }
    });
  },
  { threshold: 0.1 },
);

// [scripts.js] Inside async function loadData()

async function loadData() {
  try {
    const response = await fetch("portfolio-data.json");
    if (!response.ok) throw new Error("Could not load JSON.");
    portfolioData = await response.json();

    // Attach observer to all sections
    document
      .querySelectorAll("section")
      .forEach((section) => observer.observe(section));

    render();
    lucide.createIcons(); // <--- ENSURE THIS IS CALLED HERE TO RENDER HERO ICONS
  } catch (err) {
    console.error(
      "Data load failed. Please run this using a local server (Live Server).",
      err,
    );
  }
}

function render() {
  if (!portfolioData) return;

  document.getElementById("hero-title").innerText =
    portfolioData.profile.title[currentLang];
  document.getElementById("bio-text").innerText =
    portfolioData.profile.bio[currentLang];
  document.getElementById("lang-label").innerText =
    currentLang === "en" ? "ESP" : "ENG";

  // Translate static UI elements
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (i18n[currentLang][key]) el.innerText = i18n[currentLang][key];
  });

  // Translate search placeholder
  document.getElementById("search-bar").placeholder =
    i18n[currentLang].search_placeholder;

  document.getElementById("skills-list").innerHTML = portfolioData.skills
    .map(
      (s) =>
        `<div class="info-box gaming-font" style="font-size:0.65rem;">${s}</div>`,
    )
    .join("");

  document.getElementById("languages-list").innerHTML = portfolioData.languages
    .map(
      (l) => `<div class="info-box">
                <div class="gaming-font" style="font-size:0.75rem; color:var(--accent);">${l.name[currentLang]}</div>
                <span>${l.level[currentLang]}</span>
              </div>`,
    )
    .join("");

  document.getElementById("experience-list").innerHTML =
    portfolioData.experience
      .map(
        (e) => `<div class="exp-item">
                <div class="glass-card">
                  <div style="color:var(--accent); font-size:0.7rem; font-family:Orbitron;">${e.period[currentLang]}</div>
                  <h3 class="gaming-font" style="font-size:0.95rem; margin:5px 0;">${e.role[currentLang]}</h3>
                  <p style="color:var(--accent-alt); font-size:0.8rem; font-weight:600;">${e.company}</p>
                  <p style="font-size:0.85rem; color:var(--text-secondary); margin-top:10px;">${e.desc[currentLang]}</p>
                </div>
              </div>`,
      )
      .join("");

  renderProjects();
}

function renderProjects() {
  const list = document.getElementById("project-list");
  const filtered = portfolioData.projects.filter(
    (p) =>
      (currentFilter === "all" || p.tech.includes(currentFilter)) &&
      p.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  list.innerHTML = filtered
    .map(
      (p) => `
    <div class="glass-card" style="display:flex; flex-direction:column; justify-content:space-between;">
        <div>
            <h3 class="gaming-font" style="font-size: 0.85rem; margin-bottom:15px;">${p.title}</h3>
            <p style="font-size: 0.8rem; color:var(--text-secondary); margin-bottom: 20px;">${p.desc[currentLang]}</p>
            <div>${p.tech.map((t) => `<span class="tech-pill">${t}</span>`).join("")}</div>
        </div>
        <button class="btn-ui" style="margin-top:20px; width:100%; justify-content:center;" onclick="openProject(${p.id})">
          ${i18n[currentLang].see_more}
        </button>
    </div>`,
    )
    .join("");
  lucide.createIcons();
}

window.openProject = function (id) {
  const p = portfolioData.projects.find((proj) => proj.id === id);
  document.getElementById("modal-body").innerHTML = `
    <h2 class="gaming-font" style="color:var(--accent); margin-bottom:20px; font-size:1.5rem;">${p.title}</h2>
    <p style="color:var(--text-secondary); margin-bottom:30px;">${p.summary[currentLang]}</p>
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px;">
        ${p.images.map((img) => `<img src="${img}" style="width:100%; border-radius:8px; border:1px solid var(--accent); cursor:zoom-in;" onclick="openLightbox('${img}')">`).join("")}
    </div>
    <div style="margin-top:30px;"><a href="${p.links[0]}" target="_blank" class="btn-ui">View Source Code</a></div>`;
  document.getElementById("project-modal").style.display = "flex";
  lucide.createIcons();
};

window.openLightbox = (src) => {
  document.getElementById("lightbox-img").src = src;
  document.getElementById("lightbox").style.display = "flex";
};

window.closeLightbox = () =>
  (document.getElementById("lightbox").style.display = "none");
document.getElementById("modal-close").onclick = () =>
  (document.getElementById("project-modal").style.display = "none");

document.getElementById("lang-btn").onclick = () => {
  currentLang = currentLang === "en" ? "es" : "en";
  render();
};
document.getElementById("theme-btn").onclick = () => {
  const isDark = document.body.getAttribute("data-theme") === "dark";
  document.body.setAttribute("data-theme", isDark ? "light" : "dark");
  lucide.createIcons();
};
document.getElementById("search-bar").oninput = (e) => {
  searchQuery = e.target.value;
  renderProjects();
};
document.getElementById("filter-group").onclick = (e) => {
  if (e.target.tagName === "BUTTON") {
    document
      .querySelectorAll("#filter-group button")
      .forEach((b) => b.classList.remove("active"));
    e.target.classList.add("active");
    currentFilter = e.target.getAttribute("data-filter");
    renderProjects();
  }
};

window.onload = loadData;
