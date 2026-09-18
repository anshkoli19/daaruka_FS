import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";
import MapView from "../components/MapView";

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProject, setNewProject] = useState({ name: "", description: "", project_type: "carbon" });
  const [pendingGeometry, setPendingGeometry] = useState(null);
  const [siteName, setSiteName] = useState("");
  const navigate = useNavigate();

  const loadProjects = async () => {
    const { data } = await client.get("/projects");
    setProjects(data);
    if (data.length && !selectedProject) setSelectedProject(data[0]);
  };

  useEffect(() => {
    loadProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createProject = async (e) => {
    e.preventDefault();
    const { data } = await client.post("/projects", newProject);
    setShowNewProject(false);
    setNewProject({ name: "", description: "", project_type: "carbon" });
    await loadProjects();
    setSelectedProject(data);
  };

  const addSite = async (e) => {
    e.preventDefault();
    if (!pendingGeometry || !selectedProject) return;
    await client.post(`/projects/${selectedProject.id}/sites`, {
      name: siteName,
      geometry: pendingGeometry,
    });
    setSiteName("");
    setPendingGeometry(null);
    const { data } = await client.get(`/projects/${selectedProject.id}`);
    setSelectedProject(data);
    setProjects((prev) => prev.map((p) => (p.id === data.id ? data : p)));
  };

  return (
    <div>
      <div className="dashboard-header">
        <h2>Projects</h2>
        <button className="btn-primary" onClick={() => setShowNewProject(true)}>
          + New project
        </button>
      </div>

      <div className="project-grid">
        {projects.map((p) => (
          <div
            key={p.id}
            className="project-card"
            style={{ border: selectedProject?.id === p.id ? "2px solid #0e3b2e" : "none", cursor: "pointer" }}
            onClick={() => setSelectedProject(p)}
          >
            <h3>{p.name}</h3>
            <p style={{ color: "#55665f", fontSize: "0.9rem" }}>{p.description}</p>
            <p style={{ fontSize: "0.8rem" }}>
              {p.project_type} · {p.sites.length} site{p.sites.length !== 1 ? "s" : ""}
            </p>
          </div>
        ))}
      </div>

      {selectedProject && (
        <>
          <h3>{selectedProject.name} — sites map</h3>
          <MapView
            sites={selectedProject.sites}
            onPolygonDrawn={(geom) => setPendingGeometry(geom)}
            onSiteClick={(siteId) => navigate(`/sites/${siteId}`)}
          />

          {pendingGeometry && (
            <form onSubmit={addSite} style={{ display: "flex", gap: 10, marginBottom: 24 }}>
              <input
                placeholder="New site name"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                required
                style={{ padding: 8, borderRadius: 6, border: "1px solid #ccc", flex: 1 }}
              />
              <button className="btn-primary" type="submit">
                Save site
              </button>
            </form>
          )}

          <h3>Sites</h3>
          <ul className="site-list">
            {selectedProject.sites.map((s) => (
              <li key={s.id} onClick={() => navigate(`/sites/${s.id}`)}>
                {s.name} — {s.area_hectares ?? "—"} ha
              </li>
            ))}
            {selectedProject.sites.length === 0 && <p>No sites yet — draw a polygon on the map to add one.</p>}
          </ul>
        </>
      )}

      {showNewProject && (
        <div className="modal-backdrop" onClick={() => setShowNewProject(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>New project</h3>
            <form onSubmit={createProject}>
              <label>Name</label>
              <input
                value={newProject.name}
                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                required
                style={{ width: "100%", padding: 8, margin: "6px 0 12px" }}
              />
              <label>Description</label>
              <input
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                style={{ width: "100%", padding: 8, margin: "6px 0 12px" }}
              />
              <label>Type</label>
              <select
                value={newProject.project_type}
                onChange={(e) => setNewProject({ ...newProject, project_type: e.target.value })}
                style={{ width: "100%", padding: 8, margin: "6px 0 16px" }}
              >
                <option value="carbon">Carbon</option>
                <option value="biodiversity">Biodiversity</option>
              </select>
              <button className="btn-primary" type="submit">
                Create
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
