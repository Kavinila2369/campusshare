import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import API from "../api";

export default function Dashboard() {
  const [resources, setResources] = useState([]);
  const [myResources, setMyResources] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [file, setFile] = useState(null);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const load = async () => {
    try {
      const [available, mine] = await Promise.all([
        API.get("/resources/all"),
        API.get("/resources/mine")
      ]);

      setResources(available.data);
      setMyResources(mine.data);
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.clear();
        navigate("/");
      } else {
        console.error(error);
      }
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (!stored || !token) {
      localStorage.clear();
      return navigate("/");
    }
    setUser(JSON.parse(stored));
    load();
  }, [navigate]);

  const upload = async () => {
    try {
      if (!file) return alert("Please select a file.");
      const allowedTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
      if (!allowedTypes.includes(file.type)) return alert("Only PDF, JPG, JPEG or PNG files are allowed.");
      if (file.size > 2 * 1024 * 1024) return alert("File must be 2MB or smaller.");

      const form = new FormData();
      form.append("title", title);
      form.append("description", description);
      form.append("category", category);
      form.append("file", file);

      await API.post("/resources/add", form);
      setTitle("");
      setDescription("");
      setCategory("");
      setFile(null);
      load();
      toast.success("Uploaded successfully");
    } catch (error) {
      const msg = error.response?.data?.msg || error.message || "Upload failed";
      alert(msg);
      console.error(error);
    }
  };

  const requestResource = async (id) => {
    try {
      await API.post(`/resources/request/${id}`);
      load();
    } catch (error) {
      const msg = error.response?.data?.msg || error.message || "Request failed";
      alert(msg);
      console.error(error);
    }
  };

  const returnResource = async (id) => {
    try {
      await API.post(`/resources/return/${id}`);
      load();
    } catch (error) {
      const msg = error.response?.data?.msg || error.message || "Return failed";
      alert(msg);
      console.error(error);
    }
  };

  const approveResource = async (id) => {
    try {
      await API.post(`/resources/owner/approve/${id}`);
      load();
    } catch (error) {
      const msg = error.response?.data?.msg || error.message || "Approval failed";
      alert(msg);
      console.error(error);
    }
  };

  const rejectResource = async (id) => {
    try {
      await API.post(`/resources/owner/reject/${id}`);
      load();
    } catch (error) {
      const msg = error.response?.data?.msg || error.message || "Rejection failed";
      alert(msg);
      console.error(error);
    }
  };

  const isResourceOwner = (resource) => {
    const ownerId = resource.owner?._id?.toString?.() || resource.owner?._id;
    return ownerId === user?.id;
  };

  const getRequestStatus = (resource) => {
    if (resource.status === "available") return "Available";
    if (resource.status === "pending") return "Pending admin approval";
    if (resource.status === "requested") {
      if (resource.requestedBy?.email === user?.email) return "Request Pending";
      if (isResourceOwner(resource)) return "Request Received";
      return "Requested";
    }
    if (resource.status === "borrowed") {
      if (resource.requestedBy?.email === user?.email) return "Accepted";
      if (isResourceOwner(resource)) return "Lent Out";
      return "Borrowed";
    }
    return resource.status;
  };

  const incomingRequests = myResources.filter(
    (resource) => resource.status === "requested" && isResourceOwner(resource)
  );

  const myResourceList = myResources.filter(
    (resource) => !(resource.status === "requested" && isResourceOwner(resource))
  );

  const sentRequests = myResources.filter(
    (resource) => resource.requestedBy?.email === user?.email && resource.status === "requested"
  );

  return (
    <div>
      <div className="sidebar">
        <h2> CampusShare</h2>
        <a href="/dashboard">Dashboard</a>
        {user?.role === "admin" && <a href="/admin">Admin</a>}
        <a
          onClick={() => {
            localStorage.clear();
            window.location.href = "/";
          }}
        >
          Logout
        </a>
      </div>

      <div className="main">
        <div className="card">
          <h3>Upload Resource</h3>
          <input value={title} placeholder="Title" onChange={(e) => setTitle(e.target.value)} />
          <input value={description} placeholder="Description (optional)" onChange={(e) => setDescription(e.target.value)} />
          <input value={category} placeholder="Category" onChange={(e) => setCategory(e.target.value)} />
          <input type="file" onChange={(e) => setFile(e.target.files[0])} />
          <button className="btn green" onClick={upload}>
            Upload
          </button>
        </div>

        <div className="card">
          <h3>Available Resources</h3>
          {resources.length === 0 && <p>No resources are available currently.</p>}
          {resources.map((resource) => (
            <div className="card" key={resource._id} style={{ marginBottom: 16 }}>
              <h4>{resource.title}</h4>
              <p>{resource.description || "No description provided."}</p>
              <p><strong>Owner:</strong> {resource.owner?.name} ({resource.owner?.department})</p>
              <a href={`http://localhost:5000/uploads/${resource.file}`} target="_blank" rel="noreferrer">
                View File
              </a>
              {resource.status === "available" && !isResourceOwner(resource) ? (
                <button className="btn blue" style={{ marginTop: 12 }} onClick={() => requestResource(resource._id)}>
                  Send Request
                </button>
              ) : isResourceOwner(resource) ? (
                <div style={{ marginTop: 12, color: "#555" }}>
                  Your resource
                </div>
              ) : (
                <div style={{ marginTop: 12, color: "#555" }}>
                  {resource.status === "requested" ? "Request sent" : resource.status === "borrowed" ? "Borrowed" : "Not available"}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="card">
          <h3>Incoming Requests</h3>
          {incomingRequests.length === 0 && <p>No incoming requests at the moment.</p>}
          {incomingRequests.map((resource) => (
            <div className="card" key={resource._id} style={{ marginBottom: 16 }}>
              <h4>{resource.title}</h4>
              <p><strong>Status:</strong> {getRequestStatus(resource)}</p>
              <p>{resource.description || "No description."}</p>
              <p><strong>Requested by:</strong> {resource.requestedBy?.name}</p>
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button className="btn blue" onClick={() => approveResource(resource._id)}>
                  Accept Request
                </button>
                <button className="btn red" onClick={() => rejectResource(resource._id)}>
                  Reject Request
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <h3>My Resource Activity</h3>
          {myResourceList.length === 0 && incomingRequests.length === 0 && (
            <p>You have not uploaded or requested any resources yet.</p>
          )}
          {myResourceList.map((resource) => (
            <div className="card" key={resource._id} style={{ marginBottom: 16 }}>
              <h4>{resource.title}</h4>
              <p><strong>Status:</strong> {getRequestStatus(resource)}</p>
              <p>{resource.description || "No description."}</p>
              <p><strong>Uploaded by:</strong> {resource.owner?.name}</p>
              {resource.requestedBy && <p><strong>Requested by:</strong> {resource.requestedBy.name}</p>}
              {resource.status === "borrowed" && resource.requestedBy?.email === user?.email && (
                <button className="btn red" onClick={() => returnResource(resource._id)}>
                  Return Resource
                </button>
              )}
              {sentRequests.length > 0 && resource.requestedBy?.email === user?.email && (
                <p style={{ marginTop: 8, color: "#555" }}>Your request is pending owner approval.</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
