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

async function loadData() {
  try {
    const response = await fetch("portfolio-data.json");
    if (!response.ok) throw new Error("Could not load JSON.");
    portfolioData = await response.json();

    document
      .querySelectorAll("section")
      .forEach((section) => observer.observe(section));

    render();
    lucide.createIcons();

    // START SYSTEM LOGS
    loadGitHubLogs();
  } catch (err) {
    console.error("Data load failed.", err);
    const main = document.querySelector("main");
    main.innerHTML = `
        <div class="container" style="height:100vh; display:flex; justify-content:center; align-items:center;">
            <div class="glass-card error-message">
                <h2 style="color:red; font-family:'Orbitron';">SYSTEM FAILURE</h2>
                <p>Unable to load 'portfolio-data.json'. Please ensure you are running this on a local server (e.g., Live Server).</p>
                <p style="font-size:0.8rem; color:var(--text-secondary); margin-top:10px;">Error: ${err.message}</p>
            </div>
        </div>`;
  }
}

function render() {
  if (!portfolioData) return;

  // Render Status
  document.getElementById("hero-title").innerText =
    portfolioData.profile.title[currentLang];
  const statusEl = document.getElementById("status-badge");
  const statusText = document.getElementById("status-text");
  const statusData = portfolioData.profile.status;
  if (statusData && statusEl && statusText) {
    statusText.innerText = statusData.text[currentLang];
    statusEl.className = "status-badge";
    if (statusData.state === "online") statusEl.classList.add("status-online");
    else if (statusData.state === "busy") statusEl.classList.add("status-busy");
    else statusEl.classList.add("status-offline");
  }

  document.getElementById("bio-text").innerText =
    portfolioData.profile.bio[currentLang];
  document.getElementById("lang-label").innerText =
    currentLang === "en" ? "ESP" : "ENG";

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (i18n[currentLang][key]) el.innerText = i18n[currentLang][key];
  });
  document.getElementById("search-bar").placeholder =
    i18n[currentLang].search_placeholder;

  document.getElementById("skills-list").innerHTML = portfolioData.skills
    .map(
      (s) =>
        `<div class="info-box gaming-font skill-tag" data-skill="${s}" style="font-size:0.65rem;">${s}</div>`,
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
      .map((e) => {
        const tagString = e.tags ? e.tags.join(",") : "";
        return `<div class="exp-item" data-tags="${tagString}">
              <div class="glass-card">
                <div style="color:var(--accent); font-size:0.7rem; font-family:Orbitron;">${e.period[currentLang]}</div>
                <h3 class="gaming-font" style="font-size:0.95rem; margin:5px 0;">${e.role[currentLang]}</h3>
                <p style="color:var(--accent-alt); font-size:0.8rem; font-weight:600;">${e.company}</p>
                <p style="font-size:0.85rem; color:var(--text-secondary); margin-top:10px;">${e.desc[currentLang]}</p>
              </div>
            </div>`;
      })
      .join("");

  renderProjects();
  attachVisualizerEvents();
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
    <div class="glass-card project-card" data-tech="${p.tech.join(",")}" style="display:flex; flex-direction:column; justify-content:space-between;">
        <div>
            <h3 class="gaming-font" style="font-size: 0.85rem; margin-bottom:15px;">${p.title}</h3>
            <p style="font-size: 0.8rem; color:var(--text-secondary); margin-bottom: 20px;">${p.desc[currentLang]}</p>
            <div>${p.tech.map((t) => `<span class="tech-pill">${t}</span>`).join("")}</div>
        </div>
        <button class="btn-ui" style="margin-top:20px; width:100%; justify-content:center;" onclick="openProject(${p.id})" aria-label="View Project Details">
          ${i18n[currentLang].see_more}
        </button>
    </div>`,
    )
    .join("");
  lucide.createIcons();
}

// --- VISUALIZER LOGIC ---
function attachVisualizerEvents() {
  const skills = document.querySelectorAll(".skill-tag");
  skills.forEach((skill) => {
    skill.addEventListener("mouseenter", () => {
      const techName = skill.getAttribute("data-skill");
      highlightConnections(techName);
    });
    skill.addEventListener("mouseleave", () => resetConnections());
  });
}

function highlightConnections(techName) {
  const allProjects = document.querySelectorAll(".project-card");
  const allExp = document.querySelectorAll(".exp-item");
  const allSkills = document.querySelectorAll(".skill-tag");
  [...allProjects, ...allExp, ...allSkills].forEach((el) =>
    el.classList.add("dimmed"),
  );

  const activeSkill = document.querySelector(
    `.skill-tag[data-skill="${techName}"]`,
  );
  if (activeSkill) {
    activeSkill.classList.remove("dimmed");
    activeSkill.classList.add("highlighted");
  }
  allProjects.forEach((card) => {
    const techs = card.getAttribute("data-tech").split(",");
    if (techs.some((t) => t.includes(techName) || techName.includes(t))) {
      card.classList.remove("dimmed");
      card.classList.add("highlighted");
    }
  });
  allExp.forEach((item) => {
    const tags = item.getAttribute("data-tags").split(",");
    if (tags.some((t) => t.includes(techName) || techName.includes(t))) {
      item.classList.remove("dimmed");
      item.classList.add("highlighted");
    }
  });
}

function resetConnections() {
  document.querySelectorAll(".dimmed, .highlighted").forEach((el) => {
    el.classList.remove("dimmed", "highlighted");
  });
}

// --- SYSTEM LOGS (GitHub API) ---
async function loadGitHubLogs() {
  const logContainer = document.getElementById("github-log");
  const user = "fabianluz";

  try {
    const res = await fetch(
      `https://api.github.com/users/${user}/events?per_page=10`,
    );

    // 1. Handle Rate Limiting gracefully
    if (res.status === 403 || res.status === 429) {
      logContainer.innerHTML =
        '<div class="log-entry" style="color:#eab308">[WARN] Connection Rate Limited. Cached Mode.</div>';
      return;
    }

    if (!res.ok) throw new Error("API Error");
    const data = await res.json();

    logContainer.innerHTML = "";

    data.forEach((event, index) => {
      setTimeout(() => {
        const date = new Date(event.created_at).toISOString().split("T")[0];
        const time = new Date(event.created_at).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
        let msg = "";

        if (event.type === "PushEvent") {
          const commitCount = event.payload.commits
            ? event.payload.commits.length
            : 0;

          if (commitCount > 0) {
            msg = `Pushed ${commitCount} commits to <a href="https://github.com/${event.repo.name}" target="_blank" class="log-repo">${event.repo.name}</a>`;
          } else {
            // FIX: If 0 commits, call it a "Update" or "Sync"
            msg = `Repository Update / Sync on <a href="https://github.com/${event.repo.name}" target="_blank" class="log-repo">${event.repo.name}</a>`;
          }
        } else if (event.type === "WatchEvent") {
          msg = `Starred repository <a href="https://github.com/${event.repo.name}" target="_blank" class="log-repo">${event.repo.name}</a>`;
        } else if (event.type === "CreateEvent") {
          msg = `Created ${event.payload.ref_type || "repo"} <a href="https://github.com/${event.repo.name}" target="_blank" class="log-repo">${event.repo.name}</a>`;
        } else if (event.type === "ForkEvent") {
          msg = `Forked <a href="https://github.com/${event.repo.name}" target="_blank" class="log-repo">${event.repo.name}</a>`;
        } else {
          // Generic fallback for other events
          msg = `${event.type.replace("Event", "").toUpperCase()} on <a href="https://github.com/${event.repo.name}" target="_blank" class="log-repo">${event.repo.name}</a>`;
        }

        const div = document.createElement("div");
        div.className = "log-entry";
        div.innerHTML = `<span class="log-time">[${date} ${time}]</span> <span class="log-type">${event.type.replace("Event", "").toUpperCase()}</span> ${msg}`;
        logContainer.appendChild(div);
        logContainer.scrollTop = logContainer.scrollHeight;
      }, index * 200); // Faster typing speed
    });
  } catch (err) {
    logContainer.innerHTML =
      '<div class="log-entry" style="color:var(--term-error)">[ERROR] Connection to GitHub Mainframe failed. Offline Mode active.</div>';
  }
}

// --- PROJECT MODAL LOGIC ---
window.openProject = function (id) {
  const p = portfolioData.projects.find((proj) => proj.id === id);
  document.getElementById("modal-body").innerHTML = `
    <h2 class="gaming-font" style="color:var(--accent); margin-bottom:20px; font-size:1.5rem;">${p.title}</h2>
    <p style="color:var(--text-secondary); margin-bottom:30px;">${p.summary[currentLang]}</p>
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px;">
        ${p.images.map((img) => `<img src="${img}" style="width:100%; border-radius:8px; border:1px solid var(--accent); cursor:zoom-in;" onclick="openLightbox('${img}')" alt="${p.title} screenshot">`).join("")}
    </div>
    <div style="margin-top:30px;"><a href="${p.links[0]}" target="_blank" class="btn-ui" aria-label="View Source Code">View Source Code</a></div>`;
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

// --- UI EVENT LISTENERS ---
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

/* --- CLI TERMINAL LOGIC & VIM MODE --- */
const terminalOverlay = document.getElementById("terminal-overlay");
const terminalInput = document.getElementById("terminal-input");
const terminalBody = document.getElementById("terminal-body");
const terminalToggleBtn = document.getElementById("terminal-toggle-btn");
const terminalCloseBtn = document.getElementById("close-terminal");
const vimModal = document.getElementById("vim-cheatsheet");

let commandHistory = [];
let historyIndex = -1;

function toggleTerminal() {
  const isHidden = terminalOverlay.classList.contains("hidden");
  if (isHidden) {
    terminalOverlay.classList.remove("hidden");
    terminalInput.focus();
  } else {
    terminalOverlay.classList.add("hidden");
  }
}

function toggleVimSheet() {
  const isHidden =
    vimModal.style.display === "none" || vimModal.style.display === "";
  vimModal.style.display = isHidden ? "flex" : "none";
  lucide.createIcons();
}

// GLOBAL KEY LISTENER (Vim Mode + Shortcuts)
document.addEventListener("keydown", (e) => {
  // If typing in an input, ignore Vim keys, only handle Escape
  if (["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) {
    if (e.key === "Escape") {
      document.activeElement.blur(); // Unfocus
      if (!terminalOverlay.classList.contains("hidden")) toggleTerminal();
    }
    // Terminal Submit handled below
    return;
  }

  // Global Shortcuts
  if (e.key === "`" || (e.ctrlKey && e.key === "k")) {
    e.preventDefault();
    toggleTerminal();
    return;
  }

  // Vim Keys
  switch (e.key) {
    case "j":
    case "J":
      window.scrollBy({ top: 100, behavior: "smooth" });
      break;
    case "k":
    case "K":
      window.scrollBy({ top: -100, behavior: "smooth" });
      break;
    case "/":
      e.preventDefault();
      document.getElementById("search-bar").focus();
      document
        .getElementById("projects")
        .scrollIntoView({ behavior: "smooth" });
      break;
    case "?":
      toggleVimSheet();
      break;
    case "Escape":
      document.getElementById("project-modal").style.display = "none";
      document.getElementById("lightbox").style.display = "none";
      vimModal.style.display = "none";
      if (!terminalOverlay.classList.contains("hidden")) toggleTerminal();
      break;
  }
});

terminalToggleBtn.onclick = toggleTerminal;
terminalCloseBtn.onclick = toggleTerminal;

terminalInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const input = terminalInput.value.trim();
    if (input) {
      commandHistory.push(input);
      historyIndex = commandHistory.length;
      printLine(`guest@luz_os:~$ ${input}`, "white");
      processCommand(input);
    }
    terminalInput.value = "";
  } else if (e.key === "ArrowUp") {
    if (historyIndex > 0) {
      historyIndex--;
      terminalInput.value = commandHistory[historyIndex];
    }
  } else if (e.key === "ArrowDown") {
    if (historyIndex < commandHistory.length - 1) {
      historyIndex++;
      terminalInput.value = commandHistory[historyIndex];
    } else {
      historyIndex = commandHistory.length;
      terminalInput.value = "";
    }
  }
});

function printLine(text, color = "var(--term-text)") {
  const line = document.createElement("div");
  line.className = "terminal-line";
  line.style.color = color;
  line.innerHTML = text;
  terminalBody.appendChild(line);
  terminalBody.scrollTop = terminalBody.scrollHeight;
}

function processCommand(rawInput) {
  const args = rawInput.toLowerCase().split(" ");
  const cmd = args[0];
  switch (cmd) {
    case "help":
      printLine("AVAILABLE COMMANDS:", "var(--term-highlight)");
      printLine(
        "&nbsp;&nbsp;help&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;- Show this menu",
      );
      printLine(
        "&nbsp;&nbsp;about&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;- Display bio",
      );
      printLine(
        "&nbsp;&nbsp;skills&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;- List technical skills",
      );
      printLine(
        "&nbsp;&nbsp;projects&nbsp;&nbsp;&nbsp;- List all projects (with IDs)",
      );
      printLine(
        "&nbsp;&nbsp;open [id]&nbsp;&nbsp;- Open specific project details",
      );
      printLine(
        "&nbsp;&nbsp;contact&nbsp;&nbsp;&nbsp;&nbsp;- Show contact info",
      );
      printLine(
        "&nbsp;&nbsp;theme&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;- Toggle Light/Dark mode",
      );
      printLine(
        "&nbsp;&nbsp;lang&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;- Toggle En/Es",
      );
      printLine(
        "&nbsp;&nbsp;clear&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;- Clear terminal",
      );
      printLine(
        "&nbsp;&nbsp;exit&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;- Close terminal",
      );
      break;
    case "about":
      if (portfolioData) printLine(portfolioData.profile.bio[currentLang]);
      else printLine("Error: Data not loaded.", "red");
      break;
    case "skills":
      if (portfolioData) {
        printLine("SKILL TREE:", "var(--term-highlight)");
        portfolioData.skills.forEach((s) => printLine(`- ${s}`));
      }
      break;
    case "projects":
      if (portfolioData) {
        printLine("PROJECT VAULT:", "var(--term-highlight)");
        portfolioData.projects.forEach((p) => {
          printLine(
            `[ID: ${p.id}] ${p.title} <span style='color:#888'>(${p.tech.join(", ")})</span>`,
          );
        });
      }
      break;
    case "open":
      const id = parseInt(args[1]);
      if (!id) printLine("Usage: open [project_id]", "yellow");
      else {
        const project = portfolioData.projects.find((p) => p.id === id);
        if (project) {
          printLine(`Opening ${project.title}...`, "green");
          toggleTerminal();
          openProject(id);
        } else printLine(`Error: Project ID ${id} not found.`, "red");
      }
      break;
    case "contact":
      printLine("CONTACT INFO:", "var(--term-highlight)");
      printLine(
        "GitHub: <a href='https://github.com/fabianluz' target='_blank' style='color:#fff; text-decoration:underline;'>github.com/fabianluz</a>",
      );
      printLine("Email: fabian.luz@protonmail.com");
      break;
    case "theme":
      document.getElementById("theme-btn").click();
      const isDark = document.body.getAttribute("data-theme") === "dark";
      printLine(`System theme set to: ${isDark ? "DARK" : "LIGHT"}`);
      break;
    case "lang":
      document.getElementById("lang-btn").click();
      printLine(`Language switched to: ${currentLang.toUpperCase()}`);
      break;
    case "clear":
      terminalBody.innerHTML = "";
      break;
    case "exit":
      toggleTerminal();
      break;
    case "sudo":
      printLine(
        "Permission denied: user 'guest' is not in the sudoers file.",
        "red",
      );
      break;
    case "ls":
      printLine(
        "bio.txt&nbsp;&nbsp;skills.json&nbsp;&nbsp;projects_db.sql&nbsp;&nbsp;system32",
      );
      break;
    case "matrix":
      printLine("Follow the white rabbit...", "green");
      break;
    default:
      printLine(`Command not found: '${cmd}'.`, "var(--term-error)");
  }
}
