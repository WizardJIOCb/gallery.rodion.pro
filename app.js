const STORAGE_KEY = "rodion-web-project-gallery";

const statusLabels = {
  testing: "Тестирую",
  draft: "Черновик",
  ready: "Готово",
  archived: "Архив",
};

const statusClasses = {
  testing: "",
  draft: "status-draft",
  ready: "status-ready",
  archived: "status-archived",
};

const sampleProjects = [
  {
    id: createProjectId(),
    name: "Local Vite",
    url: "http://localhost:5173",
    description: "Быстрый слот для проекта на Vite.",
    status: "testing",
    updated: new Date().toISOString().slice(0, 10),
    tags: ["vite", "local"],
    image: "",
    notes: "Рабочий слот под локальный проект на Vite.",
  },
  {
    id: createProjectId(),
    name: "Prototype 3000",
    url: "http://localhost:3000",
    description: "Место для Next.js, React или другого локального прототипа.",
    status: "draft",
    updated: new Date().toISOString().slice(0, 10),
    tags: ["prototype", "localhost"],
    image: "",
    notes: "",
  },
];

let projects = loadProjects();
let selectedId = projects[0]?.id ?? null;

const elements = {
  grid: document.querySelector("#projectGrid"),
  emptyState: document.querySelector("#emptyState"),
  detailEmpty: document.querySelector("#detailEmpty"),
  projectDetail: document.querySelector("#projectDetail"),
  searchInput: document.querySelector("#searchInput"),
  statusFilter: document.querySelector("#statusFilter"),
  totalCount: document.querySelector("#totalCount"),
  testingCount: document.querySelector("#testingCount"),
  readyCount: document.querySelector("#readyCount"),
  dialog: document.querySelector("#projectDialog"),
  form: document.querySelector("#projectForm"),
  formTitle: document.querySelector("#formTitle"),
  id: document.querySelector("#projectId"),
  name: document.querySelector("#projectName"),
  url: document.querySelector("#projectUrl"),
  description: document.querySelector("#projectDescription"),
  status: document.querySelector("#projectStatus"),
  updated: document.querySelector("#projectUpdated"),
  tags: document.querySelector("#projectTags"),
  image: document.querySelector("#projectImage"),
  notes: document.querySelector("#projectNotes"),
  detailPreview: document.querySelector("#detailPreview"),
  detailStatus: document.querySelector("#detailStatus"),
  detailTitle: document.querySelector("#detailTitle"),
  detailDescription: document.querySelector("#detailDescription"),
  detailTags: document.querySelector("#detailTags"),
  detailUrl: document.querySelector("#detailUrl"),
  detailUpdated: document.querySelector("#detailUpdated"),
  detailNotes: document.querySelector("#detailNotes"),
  openProjectLink: document.querySelector("#openProjectLink"),
};

document.querySelector("#newProjectButton").addEventListener("click", () => openDialog());
document.querySelector("#emptyAddButton").addEventListener("click", () => openDialog());
document.querySelector("#closeDialogButton").addEventListener("click", closeDialog);
document.querySelector("#cancelButton").addEventListener("click", closeDialog);
document.querySelector("#editButton").addEventListener("click", () => {
  const project = projects.find((item) => item.id === selectedId);
  if (project) openDialog(project);
});
document.querySelector("#deleteButton").addEventListener("click", deleteSelectedProject);
elements.form.addEventListener("submit", saveProject);
elements.searchInput.addEventListener("input", render);
elements.statusFilter.addEventListener("change", render);

render();

function loadProjects() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleProjects));
      return sampleProjects;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistProjects() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

function getFilteredProjects() {
  const query = elements.searchInput.value.trim().toLowerCase();
  const status = elements.statusFilter.value;
  return projects.filter((project) => {
    const searchable = [project.name, project.url, project.description, project.notes, ...(project.tags ?? [])]
      .join(" ")
      .toLowerCase();
    const matchesQuery = !query || searchable.includes(query);
    const matchesStatus = status === "all" || project.status === status;
    return matchesQuery && matchesStatus;
  });
}

function render() {
  renderStats();

  const visibleProjects = getFilteredProjects();
  elements.grid.replaceChildren();
  elements.emptyState.hidden = visibleProjects.length > 0;

  for (const project of visibleProjects) {
    elements.grid.append(createProjectCard(project));
  }

  if (!selectedId || !projects.some((project) => project.id === selectedId)) {
    selectedId = visibleProjects[0]?.id ?? projects[0]?.id ?? null;
  }
  renderDetail();
}

function renderStats() {
  elements.totalCount.textContent = String(projects.length);
  elements.testingCount.textContent = String(projects.filter((project) => project.status === "testing").length);
  elements.readyCount.textContent = String(projects.filter((project) => project.status === "ready").length);
}

function createProjectCard(project) {
  const button = document.createElement("button");
  button.className = project.id === selectedId ? "project-card selected" : "project-card";
  button.type = "button";
  button.addEventListener("click", () => {
    selectedId = project.id;
    render();
  });

  button.append(createThumbnail(project));

  const body = document.createElement("span");
  body.className = "card-body";
  body.innerHTML = `
    <strong>${escapeHtml(project.name)}</strong>
    <small>${escapeHtml(project.description || "Без описания")}</small>
    <span class="status-pill ${statusClasses[project.status] ?? ""}">${statusLabels[project.status] ?? project.status}</span>
  `;
  button.append(body);
  return button;
}

function renderDetail() {
  const project = projects.find((item) => item.id === selectedId);
  elements.detailEmpty.hidden = Boolean(project);
  elements.projectDetail.hidden = !project;
  if (!project) return;

  elements.detailPreview.replaceChildren(createThumbnail(project, "large"));
  elements.detailStatus.textContent = statusLabels[project.status] ?? project.status;
  elements.detailStatus.className = `status-pill ${statusClasses[project.status] ?? ""}`;
  elements.detailTitle.textContent = project.name;
  elements.detailDescription.textContent = project.description || "Без описания.";
  elements.detailUrl.textContent = project.url;
  elements.detailUpdated.textContent = formatDate(project.updated);
  elements.detailNotes.textContent = project.notes || "Заметок пока нет.";
  elements.openProjectLink.href = normalizeUrl(project.url);
  elements.detailTags.replaceChildren(
    ...(project.tags ?? []).map((tag) => {
      const item = document.createElement("span");
      item.textContent = tag;
      return item;
    }),
  );
}

function openDialog(project) {
  elements.form.reset();
  elements.formTitle.textContent = project ? "Редактировать проект" : "Новый проект";
  elements.id.value = project?.id ?? "";
  elements.name.value = project?.name ?? "";
  elements.url.value = project?.url ?? "";
  elements.description.value = project?.description ?? "";
  elements.status.value = project?.status ?? "testing";
  elements.updated.value = project?.updated ?? new Date().toISOString().slice(0, 10);
  elements.tags.value = (project?.tags ?? []).join(", ");
  elements.image.value = project?.image ?? "";
  elements.notes.value = project?.notes ?? "";
  elements.dialog.showModal();
  elements.name.focus();
}

function closeDialog() {
  elements.dialog.close();
  elements.form.reset();
}

function saveProject(event) {
  event.preventDefault();

  const id = elements.id.value || createProjectId();
  const nextProject = {
    id,
    name: elements.name.value.trim(),
    url: elements.url.value.trim(),
    description: elements.description.value.trim(),
    status: elements.status.value,
    updated: elements.updated.value || new Date().toISOString().slice(0, 10),
    tags: parseTags(elements.tags.value),
    image: elements.image.value.trim(),
    notes: elements.notes.value.trim(),
  };

  const existingIndex = projects.findIndex((project) => project.id === id);
  if (existingIndex >= 0) projects[existingIndex] = nextProject;
  else projects = [nextProject, ...projects];

  selectedId = id;
  persistProjects();
  closeDialog();
  render();
}

function deleteSelectedProject() {
  const project = projects.find((item) => item.id === selectedId);
  if (!project) return;
  if (!window.confirm(`Удалить "${project.name}" из галереи?`)) return;

  projects = projects.filter((item) => item.id !== selectedId);
  selectedId = projects[0]?.id ?? null;
  persistProjects();
  render();
}

function createThumbnail(project, size = "card") {
  const wrapper = document.createElement("div");
  wrapper.className = size === "large" ? "preview-frame" : "thumb";

  if (project.image) {
    const image = document.createElement("img");
    image.src = project.image;
    image.alt = "";
    image.loading = "lazy";
    wrapper.append(image);
    return wrapper;
  }

  const fallback = document.createElement("div");
  fallback.className = "thumb-fallback";
  fallback.textContent = getInitials(project.name);
  wrapper.append(fallback);
  return wrapper;
}

function parseTags(value) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function getInitials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function normalizeUrl(url) {
  if (/^https?:\/\//i.test(url)) return url;
  if (/^(localhost|127\.0\.0\.1|\[::1\]|0\.0\.0\.0)(:\d+)?/i.test(url)) return `http://${url}`;
  return `https://${url}`;
}

function formatDate(value) {
  if (!value) return "Без даты";
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function escapeHtml(value) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[character],
  );
}

function createProjectId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `project-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
