
import { useEffect, useState } from "react";
import api from "./api";
import SiteMap from "./SiteMap";
import MetricsChart from "./MetricsChart";
import {
  Leaf,
  FolderKanban,
  LogIn,
  LoaderCircle,
} from "lucide-react";

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loggedIn, setLoggedIn] = useState(
    Boolean(localStorage.getItem("access_token"))
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [projects, setProjects] = useState([]);
  const [projectSiteCounts, setProjectSiteCounts] = useState({});
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [creatingProject, setCreatingProject] = useState(false);

  const [sites, setSites] = useState([]);
  const [siteName, setSiteName] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [siteBoundary, setSiteBoundary] = useState(null);
  const [creatingSite, setCreatingSite] = useState(false);

  const [selectedSiteId, setSelectedSiteId] = useState("");
  const [metricType, setMetricType] = useState("carbon");
  const [metricValue, setMetricValue] = useState("");
  const [metricUnit, setMetricUnit] = useState("tCO2e");
  const [creatingMetric, setCreatingMetric] = useState(false);

  const [metrics, setMetrics] = useState([]);
  const [loadingMetrics, setLoadingMetrics] = useState(false);

  // Load projects belonging to the logged-in user.
  async function loadProjects() {
    const response = await api.get("/projects/");
    setProjects(response.data);
    return response.data;
  }

  // Load sites for the selected project.
  async function loadSites(projectId) {
    if (!projectId) {
      setSites([]);
      setSelectedSiteId("");
      setMetrics([]);
      return;
    }

    try {
      const response = await api.get(
        `/sites/project/${projectId}`
      );

      setSites(response.data);
      setSelectedSiteId("");
      setMetrics([]);
    } catch (err) {
      console.error(
        "Load sites error:",
        err.response?.data || err.message
      );

      setError("Could not load sites for this project.");
    }
  }

  // Load saved metrics for a selected site.
  async function loadMetrics(siteId) {
    if (!siteId) {
      setMetrics([]);
      return;
    }

    setLoadingMetrics(true);

    try {
      const response = await api.get(
        `/metrics/site/${siteId}`
      );

      setMetrics(
        Array.isArray(response.data) ? response.data : []
      );
    } catch (err) {
      console.error(
        "Load metrics error:",
        err.response?.data || err.message
      );

      setMetrics([]);
      setError("Could not load metrics for this site.");
    } finally {
      setLoadingMetrics(false);
    }
  }

  // If a saved token exists, load projects on page refresh.
  useEffect(() => {
    if (loggedIn) {
      loadProjects().catch((err) => {
        console.error(
          "Load projects error:",
          err.response?.data || err.message
        );

        setError("Could not load projects. Please log in again.");
      });
    }
  }, [loggedIn]);

  
useEffect(() => {
  if (!loggedIn || projects.length === 0) {
    setProjectSiteCounts({});
    return;
  }

  const loadAllProjectSiteCounts = async () => {
    try {
      const results = await Promise.all(
        projects.map(async (project) => {
          const response = await api.get(
            `/sites/project/${project.id}`
          );

          return {
            projectId: String(project.id),
            count: Array.isArray(response.data)
              ? response.data.length
              : 0,
          };
        })
      );

      const counts = {};

      results.forEach((result) => {
        counts[result.projectId] = result.count;
      });

      setProjectSiteCounts(counts);
    } catch (err) {
      console.error(
        "Load project site counts error:",
        err.response?.data || err.message
      );
    }
  };

  loadAllProjectSiteCounts();
}, [loggedIn, projects]);

  // Login.
  async function handleLogin(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await api.post("/auth/login", {
        email: email.trim(),
        password,
      });

      const token = response.data.access_token;

      if (!token) {
        throw new Error("Login response did not contain a token.");
      }

      localStorage.setItem("access_token", token);
      setLoggedIn(true);

      try {
        await loadProjects();
      } catch (err) {
        console.error(
          "Projects request failed:",
          err.response?.data || err.message
        );

        setError(
          "Login succeeded, but projects could not load. " +
          "Check the backend and try Refresh projects."
        );
      }
    } catch (err) {
      console.error(
        "Login request failed:",
        err.response?.data || err.message
      );

      setError(
        err.response?.data?.detail ||
        err.message ||
        "Login request failed. Check the browser console."
      );
    } finally {
      setLoading(false);
    }
  }

  // Logout.
  function handleLogout() {
    localStorage.removeItem("access_token");

    setLoggedIn(false);
    setProjects([]);
    setSites([]);
    setMetrics([]);
    setSelectedProjectId("");
    setSelectedSiteId("");
    setSiteBoundary(null);
    setEmail("");
    setPassword("");
    setError("");
  }

  // Create a project.
  async function handleCreateProject(event) {
    event.preventDefault();
    setCreatingProject(true);
    setError("");

    try {
      await api.post("/projects/", {
        name: projectName.trim(),
        description: projectDescription.trim(),
      });

      setProjectName("");
      setProjectDescription("");

      await loadProjects();
    } catch (err) {
      console.error(
        "Create project error:",
        err.response?.data || err.message
      );

      setError(
        err.response?.data?.detail ||
        "Could not create project."
      );
    } finally {
      setCreatingProject(false);
    }
  }

  // Create a site with its drawn map boundary.
  async function handleCreateSite(event) {
    event.preventDefault();
    setError("");

    if (!selectedProjectId) {
      setError("Please select a project.");
      return;
    }

    if (!siteBoundary) {
      setError("Please draw a site boundary on the map.");
      return;
    }

    if (!siteName.trim()) {
      setError("Please enter a site name.");
      return;
    }

    setCreatingSite(true);

    try {
      await api.post("/sites/", {
        name: siteName.trim(),
        project_id: Number(selectedProjectId),
        boundary: siteBoundary,
      });

      setSiteName("");
      setSiteBoundary(null);

      await loadSites(selectedProjectId);

      alert("Site created successfully!");
    } catch (err) {
      console.error(
        "Create site error:",
        err.response?.data || err.message
      );

      setError(
        err.response?.data?.detail ||
        "Could not create site."
      );
    } finally {
      setCreatingSite(false);
    }
  }

  // Save an environmental metric.
  async function handleCreateMetric(event) {
    event.preventDefault();
    setError("");

    if (!selectedSiteId) {
      setError("Please select a site.");
      return;
    }

    if (
      metricValue === "" ||
      !Number.isFinite(Number(metricValue)) ||
      Number(metricValue) < 0
    ) {
      setError("Please enter a valid non-negative value.");
      return;
    }

    setCreatingMetric(true);

    try {
      await api.post("/metrics/", {
        site_id: Number(selectedSiteId),
        metric_type: metricType,
        value: Number(metricValue),
        unit: metricUnit.trim(),
      });

      setMetricValue("");

      // Reload metrics so the new record appears in the chart.
      await loadMetrics(selectedSiteId);

      alert("Environmental metric saved successfully!");
    } catch (err) {
      console.error(
        "Create metric error:",
        err.response?.data || err.message
      );

      setError(
        err.response?.data?.detail ||
        "Could not save metric."
      );
    } finally {
      setCreatingMetric(false);
    }
  }

  // Login screen.
  if (!loggedIn) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-md rounded-2xl shadow-lg p-8">
          <div className="flex justify-center items-center gap-2 mb-6">
            <Leaf size={34} className="text-green-700" />
            <h1 className="text-2xl font-bold text-green-800">
              Darukaa.Earth
            </h1>
          </div>

          <h2 className="text-2xl font-bold text-center text-slate-800">
            Welcome back
          </h2>

          <p className="text-center text-slate-500 mt-2 mb-7">
            Log in to manage your environmental projects.
          </p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2">
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
                className="w-full border border-slate-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-green-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                required
                className="w-full border border-slate-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-green-600"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white rounded-lg py-3 font-semibold flex items-center justify-center gap-2"
            >
              {loading ? (
                <LoaderCircle className="animate-spin" size={20} />
              ) : (
                <LogIn size={20} />
              )}

              {loading ? "Logging in..." : "Log In"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Dashboard.
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Leaf className="text-green-700" size={28} />
          <h1 className="text-xl font-bold text-green-800">
            Darukaa.Earth
          </h1>
        </div>

        <button
          onClick={handleLogout}
          className="text-sm font-medium text-green-700 hover:text-green-900"
        >
          Log out
        </button>
      </header>

      <main className="max-w-6xl mx-auto p-6 md:p-10">
        <h2 className="text-3xl font-bold text-slate-800">
          Your Dashboard
        </h2>

        <p className="text-slate-500 mt-2 mb-8">
          Manage your environmental projects and sites.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-6">
            {error}
          </div>
        )}

        {/* Add a Site */}
        <section className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
          <h3 className="text-xl font-bold mb-4">
            Add a Site
          </h3>

          <form onSubmit={handleCreateSite} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Site Name
              </label>

              <input
                type="text"
                value={siteName}
                onChange={(event) => setSiteName(event.target.value)}
                placeholder="e.g. Pune Forest Area"
                minLength={2}
                maxLength={100}
                required
                className="w-full border border-slate-300 rounded-lg px-4 py-3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Select Project
              </label>

              <select
                value={selectedProjectId}
                onChange={(event) => {
                  const projectId = event.target.value;

                  setSelectedProjectId(projectId);
                  setSiteBoundary(null);
                  setError("");
                  loadSites(projectId);
                }}
                required
                className="w-full border border-slate-300 rounded-lg px-4 py-3"
              >
                <option value="">Choose a project</option>

                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Draw Site Boundary
              </label>

              <SiteMap
                onBoundaryChange={setSiteBoundary}
                sites={sites}
              />

              <p className="text-xs text-slate-500 mt-2">
                Use the polygon tool on the map to draw your
                site's boundary. You can delete and redraw it
                before saving.
              </p>

              <p className="text-sm mt-2">
                {siteBoundary
                  ? "Boundary drawn. Ready to save."
                  : "No boundary drawn yet."}
              </p>
            </div>

            <button
              type="submit"
              disabled={
                creatingSite ||
                projects.length === 0 ||
                !siteBoundary
              }
              className="bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white rounded-lg px-5 py-3 font-semibold"
            >
              {creatingSite ? "Creating Site..." : "Create Site"}
            </button>
          </form>
        </section>

        {/* Environmental Metrics */}
        <section className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
          <h3 className="text-xl font-bold mb-4">
            Add Environmental Metric
          </h3>

          <form onSubmit={handleCreateMetric} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Select Site
              </label>

              <select
                value={selectedSiteId}
                onChange={(event) => {
                  const siteId = event.target.value;

                  setSelectedSiteId(siteId);
                  setMetrics([]);
                  setError("");
                  loadMetrics(siteId);
                }}
                required
                className="w-full border border-slate-300 rounded-lg px-4 py-3"
              >
                <option value="">Choose a site</option>

                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Metric Type
              </label>

              <select
                value={metricType}
                onChange={(event) => {
                  const type = event.target.value;

                  setMetricType(type);
                  setMetricUnit(
                    type === "carbon" ? "tCO2e" : "species"
                  );
                }}
                className="w-full border border-slate-300 rounded-lg px-4 py-3"
              >
                <option value="carbon">Carbon</option>
                <option value="biodiversity">Biodiversity</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Value
              </label>

              <input
                type="number"
                min="0"
                step="any"
                value={metricValue}
                onChange={(event) => setMetricValue(event.target.value)}
                placeholder="Enter measured value"
                required
                className="w-full border border-slate-300 rounded-lg px-4 py-3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Unit
              </label>

              <input
                type="text"
                value={metricUnit}
                onChange={(event) => setMetricUnit(event.target.value)}
                required
                className="w-full border border-slate-300 rounded-lg px-4 py-3"
              />
            </div>

            <button
              type="submit"
              disabled={creatingMetric || !selectedSiteId}
              className="bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white rounded-lg px-5 py-3 font-semibold"
            >
              {creatingMetric ? "Saving..." : "Save Metric"}
            </button>
          </form>

          {/* Metrics chart */}
          <div className="mt-8">
            <h3 className="text-xl font-bold mb-4">
              Environmental Metrics Dashboard
            </h3>

            {loadingMetrics ? (
              <p className="text-slate-500">Loading metrics...</p>
            ) : !selectedSiteId ? (
              <p className="text-slate-500">
                Select a site to view its environmental metrics.
              </p>
            ) : (
              <MetricsChart metrics={metrics} />
            )}
          </div>
        </section>

        {/* Create a Project */}
        <section className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
          <h3 className="text-xl font-bold mb-4">
            Create a Project
          </h3>

          <form onSubmit={handleCreateProject} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Project Name
              </label>

              <input
                type="text"
                value={projectName}
                onChange={(event) => setProjectName(event.target.value)}
                placeholder="e.g. Forest Restoration"
                required
                className="w-full border border-slate-300 rounded-lg px-4 py-3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Description
              </label>

              <textarea
                value={projectDescription}
                onChange={(event) =>
                  setProjectDescription(event.target.value)
                }
                placeholder="Describe your environmental project"
                rows={3}
                className="w-full border border-slate-300 rounded-lg px-4 py-3"
              />
            </div>

            <button
              type="submit"
              disabled={creatingProject}
              className="bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white rounded-lg px-5 py-3 font-semibold"
            >
              {creatingProject ? "Creating..." : "Create Project"}
            </button>
          </form>
        </section>

       
{/* Existing Projects */}

{/* Existing Projects */}
<section className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
  <h3 className="text-xl font-bold mb-4">
    Existing Projects
  </h3>

  {projects.length === 0 ? (
    <p className="text-slate-500">
      No projects created yet.
    </p>
  ) : (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {projects.map((project) => (
        <div
          key={project.id}
          className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition"
        >
          <h4 className="text-lg font-semibold text-green-800">
            {project.name}
          </h4>

          <p className="text-sm text-slate-600 mt-2">
            {project.description || "No description provided."}
          </p>

          <p className="text-sm text-slate-700 mt-3">
            <strong>Sites:</strong>{" "}
            {projectSiteCounts[String(project.id)] ?? 0}
          </p>

          <button
            type="button"
            onClick={() => {
              setSelectedProjectId(String(project.id));
              setSiteBoundary(null);
              setError("");
              loadSites(String(project.id));
            }}
            className="mt-4 bg-green-700 hover:bg-green-800 text-white rounded-lg px-4 py-2"
          >
            View Project
          </button>
        </div>
      ))}
    </div>
  )}
</section>

        {/* Project Summary */}
        <section className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
          <p className="text-slate-500 text-sm">Total Projects</p>
          <p className="text-3xl font-bold mt-2">
            {projects.length}
          </p>
        </section>

        {/* Project List */}
        <section className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <FolderKanban className="text-green-700" />
            <h3 className="text-xl font-bold">Your Projects</h3>
          </div>

          {projects.length === 0 ? (
            <p className="text-slate-500">
              No projects found for this account.
            </p>
          ) : (
            <div className="space-y-3">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="border border-slate-200 rounded-lg p-4"
                >
                  <h4 className="font-semibold text-slate-800">
                    {project.name}
                  </h4>

                  <p className="text-sm text-slate-500 mt-1">
                    {project.description || "No description"}
                  </p>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={async () => {
              setError("");

              try {
                await loadProjects();
              } catch (err) {
                console.error(
                  "Refresh projects error:",
                  err.response?.data || err.message
                );

                setError(
                  "Could not refresh projects. Please check your login."
                );
              }
            }}
            className="mt-5 text-sm font-semibold text-green-700 hover:text-green-900"
          >
            Refresh projects
          </button>
        </section>
      </main>
    </div>
  );
}

export default App;