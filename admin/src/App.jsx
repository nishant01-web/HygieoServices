import { useEffect, useState } from "react";

const API = "http://localhost:5000";

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [activePage, setActivePage] = useState("Dashboard");

  const [bookings, setBookings] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [prices, setPrices] = useState([]);

  const [loading, setLoading] = useState(false);

  const [selectedWorkers, setSelectedWorkers] = useState({});

  const [workerForm, setWorkerForm] = useState({
    name: "",
    phone: "",
    skill: "Water Tank Cleaning",
  });

  /* =========================
     LOGIN
  ========================= */

  const handleLogin = (e) => {
    e.preventDefault();

    if (username === "Hardik" && password === "tunnu") {
      setLoggedIn(true);
    } else {
      alert("Wrong username or password");
    }
  };

  /* =========================
     LOAD BOOKINGS
  ========================= */

  const loadBookings = async () => {
    try {
      const response = await fetch(`${API}/api/bookings`);
      const data = await response.json();
      setBookings(data);
    } catch (error) {
      console.error("Booking load error:", error);
    }
  };

  /* =========================
     LOAD WORKERS
  ========================= */

  const loadWorkers = async () => {
    try {
      const response = await fetch(`${API}/api/workers`);
      const data = await response.json();
      setWorkers(data);
    } catch (error) {
      console.error("Worker load error:", error);
    }
  };

  /* =========================
     LOAD PRICES
  ========================= */

  const loadPrices = async () => {
    try {
      const response = await fetch(`${API}/api/prices`);
      const data = await response.json();
      setPrices(data);
    } catch (error) {
      console.error("Price load error:", error);
    }
  };

  /* =========================
     INITIAL LOAD
  ========================= */

  useEffect(() => {
    if (!loggedIn) return;

    loadBookings();
    loadWorkers();
    loadPrices();
  }, [loggedIn]);

  /* =========================
     UPDATE BOOKING STATUS
  ========================= */

  const updateBookingStatus = async (id, status) => {
    try {
      setLoading(true);

      const response = await fetch(
        `${API}/api/bookings/${id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Status update failed");
        return;
      }

      await loadBookings();
    } catch (error) {
      alert("Backend connection error");
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     ASSIGN WORKER
  ========================= */

  const assignWorker = async (bookingId) => {
    const workerId = selectedWorkers[bookingId];

    if (!workerId) {
      alert("Please select a worker");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API}/api/bookings/${bookingId}/worker`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            workerId: Number(workerId),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Worker assignment failed");
        return;
      }

      alert("Worker assigned successfully");

      setSelectedWorkers((previous) => ({
        ...previous,
        [bookingId]: "",
      }));

      await loadBookings();
    } catch (error) {
      alert("Backend connection error");
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     REMOVE WORKER
  ========================= */

  const removeWorker = async (bookingId) => {
    const confirmRemove = window.confirm(
      "Remove this worker from the booking?"
    );

    if (!confirmRemove) return;

    try {
      setLoading(true);

      const response = await fetch(
        `${API}/api/bookings/${bookingId}/worker`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Worker removal failed");
        return;
      }

      await loadBookings();
    } catch (error) {
      alert("Backend connection error");
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     ADD WORKER
  ========================= */

  const addWorker = async (e) => {
    e.preventDefault();

    if (
      !workerForm.name.trim() ||
      !workerForm.phone.trim() ||
      !workerForm.skill.trim()
    ) {
      alert("Please fill all worker details");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API}/api/workers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(workerForm),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Worker add failed");
        return;
      }

      alert("Worker added successfully");

      setWorkerForm({
        name: "",
        phone: "",
        skill: "Water Tank Cleaning",
      });

      await loadWorkers();
    } catch (error) {
      alert("Backend connection error");
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     WORKER STATUS
  ========================= */

  const updateWorkerStatus = async (id, status) => {
    try {
      const response = await fetch(
        `${API}/api/workers/${id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Status update failed");
        return;
      }

      await loadWorkers();
    } catch (error) {
      alert("Backend connection error");
    }
  };

  /* =========================
     DELETE WORKER
  ========================= */

  const deleteWorker = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this worker?"
    );

    if (!confirmDelete) return;

    try {
      const response = await fetch(
        `${API}/api/workers/${id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Worker delete failed");
        return;
      }

      await loadWorkers();
    } catch (error) {
      alert("Backend connection error");
    }
  };

  /* =========================
     UPDATE PRICE
  ========================= */

  const updatePrice = async (id, price) => {
    const newPrice = Number(price);

    if (!Number.isFinite(newPrice) || newPrice < 0) {
      alert("Enter a valid price");
      return;
    }

    try {
      const response = await fetch(
        `${API}/api/prices/${id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            price: newPrice,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Price update failed");
        return;
      }

      await loadPrices();
    } catch (error) {
      alert("Backend connection error");
    }
  };

  /* =========================
     DASHBOARD COUNTS
  ========================= */

  const totalBookings = bookings.length;

  const pendingBookings = bookings.filter(
    (item) => item.status === "Pending"
  ).length;

  const completedBookings = bookings.filter(
    (item) => item.status === "Completed"
  ).length;

  const activeWorkers = workers.filter(
    (item) => item.status === "Active"
  ).length;

  /* =========================
     LOGIN SCREEN
  ========================= */

  if (!loggedIn) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "#f1f5f9",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <form
          onSubmit={handleLogin}
          style={{
            width: "360px",
            background: "white",
            padding: "35px",
            borderRadius: "18px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
          }}
        >
          <h1
            style={{
              marginTop: 0,
              textAlign: "center",
              color: "#0f766e",
            }}
          >
            Hygieo Services
          </h1>

          <p
            style={{
              textAlign: "center",
              color: "#64748b",
              marginBottom: "25px",
            }}
          >
            Admin Panel
          </p>

          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{
              width: "100%",
              padding: "13px",
              marginBottom: "15px",
              border: "1px solid #cbd5e1",
              borderRadius: "10px",
              boxSizing: "border-box",
            }}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: "100%",
              padding: "13px",
              marginBottom: "20px",
              border: "1px solid #cbd5e1",
              borderRadius: "10px",
              boxSizing: "border-box",
            }}
          />

          <button
            type="submit"
            style={{
              width: "100%",
              padding: "13px",
              border: "none",
              borderRadius: "10px",
              background: "#0f766e",
              color: "white",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Login
          </button>
        </form>
      </div>
    );
  }

  /* =========================
     SIDEBAR
  ========================= */

  const menuItems = [
    "Dashboard",
    "Bookings",
    "Workers",
    "Services",
    "Customers",
    "Live Tracking",
    "Reports",
  ];

  /* =========================
     MAIN PANEL
  ========================= */

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        background: "#f8fafc",
        fontFamily: "Arial, sans-serif",
        color: "#000000",
      }}
    >
      {/* SIDEBAR */}

      <aside
        style={{
          width: "230px",
          background: "#0f172a",
          color: "white",
          padding: "20px",
          boxSizing: "border-box",
        }}
      >
        <h2
          style={{
            marginTop: 0,
            color: "#5eead4",
          }}
        >
          HYGIEO
        </h2>

        <p
          style={{
            color: "#94a3b8",
            fontSize: "13px",
            marginBottom: "25px",
          }}
        >
          Admin Panel
        </p>

        {menuItems.map((item) => (
          <button
            key={item}
            onClick={() => setActivePage(item)}
            style={{
              display: "block",
              width: "100%",
              textAlign: "left",
              padding: "12px",
              marginBottom: "7px",
              border: "none",
              borderRadius: "8px",
              background:
                activePage === item
                  ? "#0f766e"
                  : "transparent",
              color: "white",
              cursor: "pointer",
            }}
          >
            {item}
          </button>
        ))}

        <button
          onClick={() => setLoggedIn(false)}
          style={{
            display: "block",
            width: "100%",
            marginTop: "30px",
            padding: "11px",
            border: "1px solid #475569",
            borderRadius: "8px",
            background: "transparent",
            color: "white",
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      </aside>

      {/* MAIN CONTENT */}

      <main
        style={{
          flex: 1,
          padding: "30px",
          boxSizing: "border-box",
          color: "#000000",
        }}
      >
        {/* =========================
            DASHBOARD
        ========================= */}

        {activePage === "Dashboard" && (
          <>
            <h1>Dashboard</h1>

            <p style={{ color: "#64748b" }}>
              Welcome to Hygieo Services Admin Panel
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "18px",
                marginTop: "25px",
              }}
            >
              <div
                style={{
                  background: "white",
                  padding: "22px",
                  borderRadius: "14px",
                  color: "#000000",
                  boxShadow:
                    "0 4px 15px rgba(0,0,0,0.06)",
                }}
              >
                <h3 style={{ color: "#000000" }}>
                  Total Bookings
                </h3>

                <h1 style={{ color: "#000000" }}>
                  {totalBookings}
                </h1>
              </div>

              <div
                style={{
                  background: "white",
                  padding: "22px",
                  borderRadius: "14px",
                  color: "#000000",
                  boxShadow:
                    "0 4px 15px rgba(0,0,0,0.06)",
                }}
              >
                <h3 style={{ color: "#000000" }}>
                  Pending
                </h3>

                <h1 style={{ color: "#000000" }}>
                  {pendingBookings}
                </h1>
              </div>

              <div
                style={{
                  background: "white",
                  padding: "22px",
                  borderRadius: "14px",
                  color: "#000000",
                  boxShadow:
                    "0 4px 15px rgba(0,0,0,0.06)",
                }}
              >
                <h3 style={{ color: "#000000" }}>
                  Completed
                </h3>

                <h1 style={{ color: "#000000" }}>
                  {completedBookings}
                </h1>
              </div>

              <div
                style={{
                  background: "white",
                  padding: "22px",
                  borderRadius: "14px",
                  color: "#000000",
                  boxShadow:
                    "0 4px 15px rgba(0,0,0,0.06)",
                }}
              >
                <h3 style={{ color: "#000000" }}>
                  Active Workers
                </h3>

                <h1 style={{ color: "#000000" }}>
                  {activeWorkers}
                </h1>
              </div>
            </div>
          </>
        )}

        {/* =========================
            BOOKINGS
        ========================= */}

        {activePage === "Bookings" && (
          <>
            <h1>Bookings</h1>

            <div
              style={{
                background: "white",
                borderRadius: "14px",
                padding: "20px",
                marginTop: "20px",
                overflowX: "auto",
              }}
            >
              {bookings.length === 0 ? (
                <p>No bookings found.</p>
              ) : (
                bookings.map((booking) => (
                  <div
                    key={booking.id}
                    style={{
                      border: "1px solid #e2e8f0",
                      borderRadius: "12px",
                      padding: "18px",
                      marginBottom: "15px",
                    }}
                  >
                    <h3 style={{ marginTop: 0 }}>
                      Booking #{booking.id}
                    </h3>

                    <p>
                      <strong>Customer:</strong>{" "}
                      {booking.name}
                    </p>

                    <p>
                      <strong>Phone:</strong>{" "}
                      {booking.phone}
                    </p>

                    <p>
                      <strong>Service:</strong>{" "}
                      {booking.service}
                    </p>

                    <p>
                      <strong>Address:</strong>{" "}
                      {booking.address}
                    </p>

                    <p>
                      <strong>Status:</strong>{" "}
                      <strong>{booking.status}</strong>
                    </p>

                    {/* PENDING */}

                    {booking.status === "Pending" && (
                      <div
                        style={{
                          display: "flex",
                          gap: "10px",
                          flexWrap: "wrap",
                          marginTop: "15px",
                        }}
                      >
                        <button
                          disabled={loading}
                          onClick={() =>
                            updateBookingStatus(
                              booking.id,
                              "Confirmed"
                            )
                          }
                          style={{
                            padding: "10px 18px",
                            border: "none",
                            borderRadius: "8px",
                            background: "#16a34a",
                            color: "white",
                            fontWeight: "bold",
                            cursor: "pointer",
                          }}
                        >
                          ✓ Confirm
                        </button>

                        <button
                          disabled={loading}
                          onClick={() =>
                            updateBookingStatus(
                              booking.id,
                              "Declined"
                            )
                          }
                          style={{
                            padding: "10px 18px",
                            border: "none",
                            borderRadius: "8px",
                            background: "#dc2626",
                            color: "white",
                            fontWeight: "bold",
                            cursor: "pointer",
                          }}
                        >
                          ✕ Decline
                        </button>
                      </div>
                    )}

                    {/* CONFIRMED */}

                    {booking.status === "Confirmed" && (
                      <div
                        style={{
                          marginTop: "15px",
                          padding: "15px",
                          borderRadius: "10px",
                          background: "#f8fafc",
                          border:
                            "1px solid #e2e8f0",
                        }}
                      >
                        <p
                          style={{
                            marginTop: 0,
                            fontWeight: "bold",
                          }}
                        >
                          Assign Worker
                        </p>

                        <div
                          style={{
                            display: "flex",
                            gap: "10px",
                            flexWrap: "wrap",
                            alignItems: "center",
                          }}
                        >
                          <select
                            value={
                              selectedWorkers[
                                booking.id
                              ] || ""
                            }
                            onChange={(e) =>
                              setSelectedWorkers({
                                ...selectedWorkers,
                                [booking.id]:
                                  e.target.value,
                              })
                            }
                            style={{
                              padding: "10px",
                              minWidth: "240px",
                              border:
                                "1px solid #cbd5e1",
                              borderRadius: "8px",
                              background: "white",
                              color: "#000000",
                            }}
                          >
                            <option value="">
                              Select Worker
                            </option>

                            {workers
                              .filter(
                                (worker) =>
                                  worker.status ===
                                  "Active"
                              )
                              .map((worker) => (
                                <option
                                  key={worker.id}
                                  value={worker.id}
                                >
                                  {worker.name} -{" "}
                                  {worker.skill}
                                </option>
                              ))}
                          </select>

                          <button
                            disabled={loading}
                            onClick={() =>
                              assignWorker(
                                booking.id
                              )
                            }
                            style={{
                              padding:
                                "10px 18px",
                              border: "none",
                              borderRadius: "8px",
                              background: "#0f766e",
                              color: "white",
                              fontWeight: "bold",
                              cursor: "pointer",
                            }}
                          >
                            Assign Worker
                          </button>
                        </div>
                      </div>
                    )}

                    {/* WORKER ASSIGNED */}

                    {booking.status ===
                      "Worker Assigned" && (
                      <div
                        style={{
                          marginTop: "15px",
                          padding: "15px",
                          borderRadius: "10px",
                          background: "#ecfdf5",
                          border:
                            "1px solid #a7f3d0",
                        }}
                      >
                        <p
                          style={{
                            margin: "0 0 7px 0",
                          }}
                        >
                          <strong>
                            Worker:
                          </strong>{" "}
                          {booking.worker_name ||
                            "Not available"}
                        </p>

                        <p
                          style={{
                            margin: "0 0 7px 0",
                          }}
                        >
                          <strong>
                            Phone:
                          </strong>{" "}
                          {booking.worker_phone ||
                            "Not available"}
                        </p>

                        <p
                          style={{
                            margin: 0,
                          }}
                        >
                          <strong>
                            Skill:
                          </strong>{" "}
                          {booking.worker_skill ||
                            "Not available"}
                        </p>

                        <div
                          style={{
                            display: "flex",
                            gap: "10px",
                            flexWrap: "wrap",
                            marginTop: "12px",
                          }}
                        >
                          <button
                            disabled={loading}
                            onClick={() =>
                              updateBookingStatus(
                                booking.id,
                                "On The Way"
                              )
                            }
                            style={{
                              padding:
                                "9px 15px",
                              border: "none",
                              borderRadius: "7px",
                              background:
                                "#2563eb",
                              color: "white",
                              fontWeight:
                                "bold",
                              cursor:
                                "pointer",
                            }}
                          >
                            On The Way
                          </button>

                          <button
                            disabled={loading}
                            onClick={() =>
                              removeWorker(
                                booking.id
                              )
                            }
                            style={{
                              padding:
                                "9px 15px",
                              border: "none",
                              borderRadius: "7px",
                              background:
                                "#64748b",
                              color: "white",
                              cursor:
                                "pointer",
                            }}
                          >
                            Remove Worker
                          </button>
                        </div>
                      </div>
                    )}

                    {/* ON THE WAY */}

                    {booking.status === "On The Way" && (
                      <div
                        style={{
                          marginTop: "15px",
                        }}
                      >
                        <button
                          disabled={loading}
                          onClick={() =>
                            updateBookingStatus(
                              booking.id,
                              "Service Started"
                            )
                          }
                          style={{
                            padding: "10px 18px",
                            border: "none",
                            borderRadius: "8px",
                            background: "#f59e0b",
                            color: "white",
                            fontWeight: "bold",
                            cursor: "pointer",
                          }}
                        >
                          Start Service
                        </button>
                      </div>
                    )}

                    {/* SERVICE STARTED */}

                    {booking.status ===
                      "Service Started" && (
                      <div
                        style={{
                          marginTop: "15px",
                        }}
                      >
                        <button
                          disabled={loading}
                          onClick={() =>
                            updateBookingStatus(
                              booking.id,
                              "Completed"
                            )
                          }
                          style={{
                            padding: "10px 18px",
                            border: "none",
                            borderRadius: "8px",
                            background: "#16a34a",
                            color: "white",
                            fontWeight: "bold",
                            cursor: "pointer",
                          }}
                        >
                          ✓ Mark Completed
                        </button>
                      </div>
                    )}

                    {/* DECLINED */}

                    {booking.status === "Declined" && (
                      <p
                        style={{
                          marginTop: "15px",
                          color: "#dc2626",
                          fontWeight: "bold",
                        }}
                      >
                        Booking Declined
                      </p>
                    )}

                    {/* COMPLETED */}

                    {booking.status === "Completed" && (
                      <p
                        style={{
                          marginTop: "15px",
                          color: "#16a34a",
                          fontWeight: "bold",
                        }}
                      >
                        ✓ Service Completed
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* =========================
            WORKERS
        ========================= */}

        {activePage === "Workers" && (
          <>
            <h1>Worker Management</h1>

            <p style={{ color: "#64748b" }}>
              Add and manage Hygieo service workers.
            </p>

            <div
              style={{
                background: "white",
                padding: "22px",
                borderRadius: "14px",
                marginTop: "20px",
                boxShadow:
                  "0 4px 15px rgba(0,0,0,0.06)",
              }}
            >
              <h2>Add New Worker</h2>

              <form
                onSubmit={addWorker}
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "12px",
                }}
              >
                <input
                  type="text"
                  placeholder="Worker Name"
                  value={workerForm.name}
                  onChange={(e) =>
                    setWorkerForm({
                      ...workerForm,
                      name: e.target.value,
                    })
                  }
                  style={{
                    padding: "12px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                  }}
                />

                <input
                  type="tel"
                  placeholder="Mobile Number"
                  value={workerForm.phone}
                  onChange={(e) =>
                    setWorkerForm({
                      ...workerForm,
                      phone: e.target.value,
                    })
                  }
                  style={{
                    padding: "12px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                  }}
                />

                <select
                  value={workerForm.skill}
                  onChange={(e) =>
                    setWorkerForm({
                      ...workerForm,
                      skill: e.target.value,
                    })
                  }
                  style={{
                    padding: "12px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                  }}
                >
                  <option>
                    Water Tank Cleaning
                  </option>
                  <option>
                    Pest Control Management
                  </option>
                  <option>
                    RO Maintenance & Repair
                  </option>
                  <option>
                    Multiple Services
                  </option>
                </select>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: "12px",
                    border: "none",
                    borderRadius: "8px",
                    background: "#0f766e",
                    color: "white",
                    fontWeight: "bold",
                    cursor: "pointer",
                  }}
                >
                  {loading
                    ? "Adding..."
                    : "Add Worker"}
                </button>
              </form>
            </div>

            <div
              style={{
                marginTop: "25px",
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "18px",
              }}
            >
              {workers.length === 0 ? (
                <div
                  style={{
                    background: "white",
                    padding: "25px",
                    borderRadius: "14px",
                  }}
                >
                  <p>No workers added yet.</p>
                </div>
              ) : (
                workers.map((worker) => (
                  <div
                    key={worker.id}
                    style={{
                      background: "white",
                      padding: "20px",
                      borderRadius: "14px",
                      boxShadow:
                        "0 4px 15px rgba(0,0,0,0.06)",
                    }}
                  >
                    <h2 style={{ marginTop: 0 }}>
                      {worker.name}
                    </h2>

                    <p>
                      <strong>Worker ID:</strong>{" "}
                      #{worker.id}
                    </p>

                    <p>
                      <strong>Mobile:</strong>{" "}
                      {worker.phone}
                    </p>

                    <p>
                      <strong>Skill:</strong>{" "}
                      {worker.skill}
                    </p>

                    <p>
                      <strong>Status:</strong>{" "}
                      <span
                        style={{
                          fontWeight: "bold",
                          color:
                            worker.status ===
                            "Active"
                              ? "#15803d"
                              : "#dc2626",
                        }}
                      >
                        {worker.status}
                      </span>
                    </p>

                    <p
                      style={{
                        color: "#64748b",
                        fontSize: "13px",
                      }}
                    >
                      Added: {worker.created_at}
                    </p>

                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        flexWrap: "wrap",
                        marginTop: "15px",
                      }}
                    >
                      <button
                        onClick={() =>
                          updateWorkerStatus(
                            worker.id,
                            worker.status ===
                              "Active"
                              ? "Inactive"
                              : "Active"
                          )
                        }
                        style={{
                          padding: "9px 12px",
                          border: "none",
                          borderRadius: "7px",
                          background:
                            worker.status ===
                            "Active"
                              ? "#f59e0b"
                              : "#16a34a",
                          color: "white",
                          cursor: "pointer",
                        }}
                      >
                        {worker.status ===
                        "Active"
                          ? "Set Inactive"
                          : "Set Active"}
                      </button>

                      <button
                        onClick={() =>
                          deleteWorker(
                            worker.id
                          )
                        }
                        style={{
                          padding: "9px 12px",
                          border: "none",
                          borderRadius: "7px",
                          background: "#dc2626",
                          color: "white",
                          cursor: "pointer",
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* =========================
            SERVICES & PRICING
        ========================= */}

        {activePage === "Services" && (
          <>
            <h1>Services & Pricing</h1>

            <p style={{ color: "#64748b" }}>
              Manage service prices from the admin panel.
            </p>

            <div
              style={{
                background: "white",
                padding: "20px",
                borderRadius: "14px",
                marginTop: "20px",
              }}
            >
              {prices.length === 0 ? (
                <p>No prices found.</p>
              ) : (
                prices.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "15px",
                      padding: "14px 0",
                      borderBottom:
                        "1px solid #e2e8f0",
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <strong>
                        {item.service_name}
                      </strong>

                      <div
                        style={{
                          color: "#64748b",
                          fontSize: "13px",
                          marginTop: "4px",
                        }}
                      >
                        {item.category}
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        alignItems: "center",
                      }}
                    >
                      <span>₹</span>

                      <input
                        type="number"
                        defaultValue={item.price}
                        id={`price-${item.id}`}
                        style={{
                          width: "100px",
                          padding: "9px",
                          border:
                            "1px solid #cbd5e1",
                          borderRadius: "7px",
                        }}
                      />

                      <button
                        onClick={() => {
                          const input =
                            document.getElementById(
                              `price-${item.id}`
                            );

                          updatePrice(
                            item.id,
                            input.value
                          );
                        }}
                        style={{
                          padding: "9px 13px",
                          border: "none",
                          borderRadius: "7px",
                          background: "#0f766e",
                          color: "white",
                          cursor: "pointer",
                        }}
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* =========================
            CUSTOMERS
        ========================= */}

        {activePage === "Customers" && (
          <>
            <h1>Customers</h1>

            <div
              style={{
                background: "white",
                padding: "20px",
                borderRadius: "14px",
                marginTop: "20px",
              }}
            >
              {bookings.length === 0 ? (
                <p>No customer records found.</p>
              ) : (
                bookings.map((booking) => (
                  <div
                    key={booking.id}
                    style={{
                      padding: "15px 0",
                      borderBottom:
                        "1px solid #e2e8f0",
                    }}
                  >
                    <strong>{booking.name}</strong>

                    <p
                      style={{
                        margin: "6px 0",
                        color: "#64748b",
                      }}
                    >
                      Phone: {booking.phone}
                    </p>

                    <p
                      style={{
                        margin: 0,
                        color: "#64748b",
                      }}
                    >
                      Address: {booking.address}
                    </p>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* =========================
            LIVE TRACKING
        ========================= */}

        {activePage === "Live Tracking" && (
          <>
            <h1>Live Tracking</h1>

            <div
              style={{
                background: "white",
                padding: "30px",
                borderRadius: "14px",
                marginTop: "20px",
                textAlign: "center",
              }}
            >
              <h2>Live Worker Tracking</h2>

              <p style={{ color: "#64748b" }}>
                GPS tracking will be connected to the
                Worker App in the next stage.
              </p>

              <div
                style={{
                  marginTop: "25px",
                  padding: "35px",
                  borderRadius: "12px",
                  background: "#000000",
                  color: "white",
                }}
              >
                🗺️ Map Area
              </div>
            </div>
          </>
        )}

        {/* =========================
            REPORTS
        ========================= */}

        {activePage === "Reports" && (
          <>
            <h1>Reports</h1>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "18px",
                marginTop: "20px",
              }}
            >
              <div
                style={{
                  background: "white",
                  padding: "22px",
                  borderRadius: "14px",
                  color: "#000000",
                }}
              >
                <h3>Total Orders</h3>
                <h2>{totalBookings}</h2>
              </div>

              <div
                style={{
                  background: "white",
                  padding: "22px",
                  borderRadius: "14px",
                  color: "#000000",
                }}
              >
                <h3>Completed Orders</h3>
                <h2>{completedBookings}</h2>
              </div>

              <div
                style={{
                  background: "white",
                  padding: "22px",
                  borderRadius: "14px",
                  color: "#000000",
                }}
              >
                <h3>Active Workers</h3>
                <h2>{activeWorkers}</h2>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default App;