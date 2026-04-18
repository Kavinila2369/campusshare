import { useEffect, useState } from "react";
import API from "../api";

export default function Admin() {
  const [resources, setResources] = useState([]);
  const [query, setQuery] = useState("");

  const load = async () => {
    try {
      const res = await API.get("/resources/allAdmin");
      setResources(res.data);
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.clear();
        window.location.href = "/";
      }
    }
  };

  useEffect(() => { load(); }, []);

  const approve = async (id) => {
    try {
      await API.post(`/resources/approve/${id}`);
      load();
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.clear();
        window.location.href = "/";
      }
    }
  };

  const approveUpload = async (id) => {
    try {
      await API.post(`/resources/approve-upload/${id}`);
      load();
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.clear();
        window.location.href = "/";
      }
    }
  };

  const reject = async (id) => {
    await API.post(`/resources/reject/${id}`);
    load();
  };

  const remove = async (id) => {
    await API.delete(`/resources/delete/${id}`);
    load();
  };

  const filtered = resources.filter((resource) => {
    const term = query.toLowerCase();
    return (
      resource.title.toLowerCase().includes(term) ||
      resource.owner?.name.toLowerCase().includes(term) ||
      resource.owner?.email.toLowerCase().includes(term) ||
      resource.status.toLowerCase().includes(term)
    );
  });

  return (
    <div className="main">
      <div className="card" style={{ marginBottom: 20, position: "relative", paddingTop: 54 }}>
        <button
          className="btn red"
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            width: "auto",
            display: "inline-block",
            padding: "4px 8px",
            fontSize: 11,
            minWidth: 58,
            height: 28,
            lineHeight: "14px"
          }}
          onClick={() => {
            localStorage.clear();
            window.location.href = "/";
          }}
        >
          Logout
        </button>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2>🛠 Admin Panel</h2>
        </div>
        <input
          className="search"
          placeholder="Search by title, owner, email or status"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {filtered.map((resource) => (
        <div className="card" key={resource._id}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3>{resource.title}</h3>
              <p>{resource.description || "No description."}</p>
              <p><strong>Owner:</strong> {resource.owner?.name} ({resource.owner?.department})</p>
              <p><strong>Status:</strong> {resource.status}</p>
              {resource.requestedBy && <p><strong>Requested by:</strong> {resource.requestedBy.name}</p>}
              {resource.file && (
                <p>
                  <a href={`http://localhost:5000/uploads/${resource.file}`} target="_blank" rel="noreferrer">
                    View Uploaded File
                  </a>
                </p>
              )}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {resource.status === "pending" && (
                <>
                  <button className="btn blue" onClick={() => approveUpload(resource._id)}>Approve Upload</button>
                </>
              )}
              {resource.status === "requested" && (
                <>
                  <button className="btn blue" onClick={() => approve(resource._id)}>Approve Request</button>
                  <button className="btn red" onClick={() => reject(resource._id)}>Reject Request</button>
                </>
              )}
              <button className="btn red" onClick={() => remove(resource._id)}>Delete</button>
            </div>
          </div>
        </div>
      ))}

      {filtered.length === 0 && <p style={{ padding: 20 }}>No resources match your search.</p>}
    </div>
  );
}