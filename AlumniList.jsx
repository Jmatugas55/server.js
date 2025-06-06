import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "../css/OverallStyle.css";
import { FaArrowCircleLeft } from "react-icons/fa";


const AlumniList = () => {
  const [alumni, setAlumni] = useState([]);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [combinedAlumni, setCombinedAlumni] = useState([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
const [deleteTarget, setDeleteTarget] = useState(null); // {id, source} or null
const [companies, setCompanies] = useState([]);

  // Modal-related states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editedData, setEditedData] = useState(null); // null means no editing

  useEffect(() => {
    fetchAlumni();
    fetchUsers();
    fetchCompanies();
  }, []);

  
const fetchCompanies = async () => {
  try {
    const res = await axios.get("http://localhost:5000/companies"); // Change URL based on your actual endpoint
    setCompanies(res.data);
  } catch (error) {
    console.error("Error fetching companies:", error);
  }
};

  const fetchAlumni = async () => {
    try {
      const res = await axios.get("http://localhost:5000/alumni");
      const dataWithSource = res.data.map((item) => ({
        ...item,
        id: item.alumni_id,
        source: "alumni",
      }));
      setAlumni(dataWithSource);
    } catch (error) {
      console.error("Error fetching alumni:", error);
    }
  };

// --- in fetchUsers (if backend updated) ---
const fetchUsers = async () => {
  try {
    const res = await axios.get("http://localhost:5000/users");
    const alumniUsers = res.data
      .filter((item) => item.role === "alumni")
      .map((item) => ({
        ...item,
        id: item.user_id,
        source: "user",
        company_id: item.company_id,       // add this line
        company_name: item.company_name,   // add this line
      }));
    setUsers(alumniUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
  }
};




  useEffect(() => {
    setCombinedAlumni([...alumni, ...users]);
  }, [alumni, users]);

  const handleSearch = (e) => {
    setSearch(e.target.value.toLowerCase());
  };

  const handleSort = () => {
    const newOrder = sortOrder === "asc" ? "desc" : "asc";
    setSortOrder(newOrder);
    const sorted = [...combinedAlumni].sort((a, b) => {
      const nameA = a.name?.toLowerCase() || "";
      const nameB = b.name?.toLowerCase() || "";
      if (newOrder === "asc") return nameA.localeCompare(nameB);
      return nameB.localeCompare(nameA);
    });
    setCombinedAlumni(sorted);
  };

  const filteredCombined = combinedAlumni.filter((person) =>
    person.name?.toLowerCase().includes(search)
  );

  const handleDelete = async (id, source) => {
    try {
      const url =
        source === "alumni"
          ? `http://localhost:5000/alumni/${id}`
          : `http://localhost:5000/users/${id}`;

      await axios.delete(url);

      if (source === "alumni") {
        setAlumni((prev) => prev.filter((a) => a.id !== id));
      } else {
        setUsers((prev) => prev.filter((u) => u.id !== id));
      }
    } catch (error) {
      console.error("Error deleting entry:", error);
    }
  };

  // Open modal with selected person's data
  const handleEdit = (id, source) => {
    const item = combinedAlumni.find((p) => p.id === id && p.source === source);
    setEditedData({ ...item });
    setIsModalOpen(true);
  };

  const handleModalChange = (e) => {
    const { name, value } = e.target;
    setEditedData((prev) => ({ ...prev, [name]: value }));
  };

  const handleModalSave = async () => {
    const { id, source, ...updatedFields } = editedData;
    try {
      const url =
        source === "alumni"
          ? `http://localhost:5000/alumni/${id}`
          : `http://localhost:5000/users/${id}`;

      await axios.put(url, updatedFields);

     await axios.put(url, updatedFields);

          if (source === "alumni") {
            fetchAlumni(); // ✅ Refetch after saving
          } else {
            fetchUsers(); // ✅ Refetch after saving
          }
      setIsModalOpen(false);
      setEditedData(null);
    } catch (error) {
      console.error("Error saving edits:", error);
    }
  };

  const handleModalCancel = () => {
    setIsModalOpen(false);
    setEditedData(null);
  };

  return (
    <div className="all" style={{marginRight: "500px"}}>
    <div className="alumni_list_container">
      <main className="alumni_dashboard_container" style={{marginRight: "40px"}}>
        <Link to="/alumnidashboard">
          <button>
            <FaArrowCircleLeft /> Back
          </button>
        </Link>
        <h1 style={{ fontSize: "45px" }}>Alumni's</h1>

        <input
          type="text"
          placeholder="Search alumni or users by name..."
          value={search}
          onChange={handleSearch}
          className="alumni_dashboard_search_input"
        />

        <button onClick={handleSort} className="alumni_dashboard_sort_button">
          Sort by Name ({sortOrder})
        </button>

        <table className="alumni_dashboard_table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Graduation Year</th>
              <th>Course</th>
              <th>Current Job</th>
              <th>Company</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCombined.length > 0 ? (
              filteredCombined.map((person) => (
                <tr key={`${person.source}-${person.id}`}>
                  <td>{person.name}</td>
                  <td>{person.graduation_year}</td>
                  <td>{person.course}</td>
                  <td>{person.current_job}</td>
                  <td>{person.company_name}</td>
                  <td>
                    <button
                      className="edit-button"
                      onClick={() => handleEdit(person.id, person.source)}
                    >
                      Edit
                    </button>
                    <button
                        className="delete-button"
                        onClick={() => {
                          setDeleteTarget({ id: person.id, source: person.source });
                          setIsDeleteModalOpen(true);
                        }}
                        style={{ marginLeft: "10px" }}
                      >
                        Delete
                      </button>

                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign: "center" }}>
                  No alumni or users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Modal */}
        {isModalOpen && editedData && (
          <div
            className="modal-overlay"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 1000,
            }}
          >
            <div
              className="modal-content"
              style={{
                backgroundColor: "white",
                padding: "20px",
                borderRadius: "8px",
                width: "400px",
                maxWidth: "90%",
                boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
              }}
            >
              <h2>Edit Entry</h2>

              <label>
                Name:
                <input
                  type="text"
                  name="name"
                  value={editedData.name || ""}
                  onChange={handleModalChange}
                />
              </label>

              <label>
                Graduation Year:
                <input
                  type="text"
                  name="graduation_year"
                  value={editedData.graduation_year || ""}
                  onChange={handleModalChange}
                />
              </label>

              <label>
                Course:
                <input
                  type="text"
                  name="course"
                  value={editedData.course || ""}
                  onChange={handleModalChange}
                />
              </label>

              <label>
                Current Job:
                <input
                  type="text"
                  name="current_job"
                  value={editedData.current_job || ""}
                  onChange={handleModalChange}
                />
              </label>

             <label>
                Company:
                <select
  name="company_id"
  value={editedData.company_id || ""}
  onChange={handleModalChange}
>
  <option value="">-- Select Company --</option>
  {companies.map((company) => (
    <option key={company.company_id} value={company.company_id}>
      {company.name}
    </option>
  ))}
</select>

              </label>



              <div style={{ marginTop: "20px", textAlign: "right" }}>
                <button
                  className="edit-button"
                  onClick={handleModalSave}
                  style={{ marginRight: "10px" }}
                >
                  Save
                </button>
                <button
                  className="delete-button"
                  onClick={handleModalCancel}
                  style={{ backgroundColor: "gray" }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {isDeleteModalOpen && deleteTarget && (
  <div
    className="modal-overlay"
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.5)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1000,
    }}
  >
    <div
      className="modal-content"
      style={{
        backgroundColor: "white",
        padding: "20px",
        borderRadius: "8px",
        width: "350px",
        maxWidth: "90%",
        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
        textAlign: "center",
      }}
    >
      <h3>Confirm Delete</h3>
      <p>Are you sure you want to delete this entry?</p>
      <div style={{ marginTop: "20px" }}>
        <button
          className="delete-button"
          onClick={async () => {
            await handleDelete(deleteTarget.id, deleteTarget.source);
            setIsDeleteModalOpen(false);
            setDeleteTarget(null);
          }}
          style={{ marginRight: "60px" , backgroundColor: "#e74c3c"}}
        >
          Delete
        </button>
        <button
          className="edit-button"
          onClick={() => {
            setIsDeleteModalOpen(false);
            setDeleteTarget(null);
          }}
          style={{ backgroundColor: "gray", marginRight:"60px" }}
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}
    </div>
    </div>
  );
};

export default AlumniList;
