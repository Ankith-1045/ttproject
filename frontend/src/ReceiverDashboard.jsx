
import { useCallback, useEffect, useState } from "react";
import api from "./api/axios";
import {
  Leaf,
  Search,
  MapPin,
  CalendarDays,
  Utensils,
  Clock,
  CheckCircle,
  LogOut,
  RefreshCw,
  HandHeart,
  Package,
  ClipboardList,
  X,
} from "lucide-react";
import "./ReceiverDashboard.css";

function NGODashboard() {
  const [user, setUser] = useState(null);
  const [donations, setDonations] = useState([]);
  const [requests, setRequests] = useState([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("available");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [quantity, setQuantity] = useState("1");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const logout = () => {
    localStorage.removeItem("nourishnetToken");
    localStorage.removeItem("nourishnetUser");
    window.location.href = "/";
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    const token = localStorage.getItem("nourishnetToken");
    const savedUser = localStorage.getItem("nourishnetUser");

    if (!token || !savedUser) {
      logout();
      return;
    }

    try {
      const parsedUser = JSON.parse(savedUser);

      if (parsedUser.role !== "receiver") {
        setError(
        
     "This page is for NGOs. Please sign in with an NGO account."

        );
        setLoading(false);
        return;
      }

      setUser(parsedUser);

      const [donationResponse, requestResponse] =
        await Promise.all([
          api.get("/donations"),
          api.get("/requests/my", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

      // FIX: Normalize donation data into an array.
      const donationBody = donationResponse.data;

      const donationData = Array.isArray(donationBody)
        ? donationBody
        : Array.isArray(donationBody?.donations)
          ? donationBody.donations
          : Array.isArray(donationBody?.data)
            ? donationBody.data
            : [];

      // FIX: Normalize request data into an array.
      const requestBody = requestResponse.data;

      const requestData = Array.isArray(requestBody)
        ? requestBody
        : Array.isArray(requestBody?.requests)
          ? requestBody.requests
          : Array.isArray(requestBody?.data)
            ? requestBody.data
            : [];

      setDonations(donationData);
      setRequests(requestData);
    } catch (err) {
      console.error("Dashboard loading error:", err);

      setError(
        err.response?.data?.message ||
          "Could not load dashboard data. Check that your backend is running."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Extra safety: these values will always be arrays.
  const safeDonations = Array.isArray(donations)
    ? donations
    : [];

  const safeRequests = Array.isArray(requests)
    ? requests
    : [];

  const filteredDonations = safeDonations.filter((donation) => {
    const searchText = search.toLowerCase();

    return (
      donation.foodName?.toLowerCase().includes(searchText) ||
      donation.pickupLocation?.toLowerCase().includes(searchText) ||
      donation.description?.toLowerCase().includes(searchText)
    );
  });

  const submitRequest = async (event) => {
    event.preventDefault();

    if (!selectedDonation) return;

    const requestedQuantity = Number(quantity);

    if (
      !Number.isInteger(requestedQuantity) ||
      requestedQuantity < 1 ||
      requestedQuantity > selectedDonation.quantity
    ) {
      setError(
        `Enter a whole number between 1 and ${selectedDonation.quantity}.`
      );
      return;
    }

    setSubmitting(true);
    setError("");
    setNotice("");

    try {
       const token = localStorage.getItem("nourishnetToken");
     
      await api.post(
        "/requests",
        {
          donationId: selectedDonation._id,
          quantityRequested: requestedQuantity,
          message,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSelectedDonation(null);
      setQuantity("1");
      setMessage("");
      setNotice("Your food request was submitted successfully!");
      setActiveTab("requests");

      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not submit your request. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "Not provided";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const statusClass = (status) =>
    ["pending", "approved", "rejected", "cancelled"].includes(status)
      ? status
      : "pending";

  if (loading && !user) {
    return (
      <div className="dashboard-loading">
        <Leaf size={34} />
        <p>Preparing your NourishNet dashboard...</p>
      </div>
    );
  }

  return (
    <main className="receiver-app">
      <aside className="receiver-sidebar">
        <div className="receiver-brand">
          <span className="receiver-brand-icon">
            <Leaf size={24} />
          </span>
          <span>NourishNet</span>
        </div>

        <p className="sidebar-caption">RECEIVER SPACE</p>

        <button
          className={`nav-item ${
            activeTab === "available" ? "selected" : ""
          }`}
          onClick={() => setActiveTab("available")}
        >
          <Package size={19} />
          Available food
        </button>

        <button
          className={`nav-item ${
            activeTab === "requests" ? "selected" : ""
          }`}
          onClick={() => setActiveTab("requests")}
        >
          <ClipboardList size={19} />
          My requests
          <span className="nav-count">{safeRequests.length}</span>
        </button>

        <div className="sidebar-bottom">
          <div className="sidebar-user">
            <div className="user-avatar">
              {user?.name?.charAt(0)?.toUpperCase() || "R"}
            </div>

            <div className="user-details">
              <strong>{user?.name || "Receiver"}</strong>
               <span>NGO</span>            </div>
          </div>

          <button className="logout-button" onClick={logout}>
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </aside>

      <section className="receiver-main">
        <header className="receiver-topbar">
          <div>
            <p className="topbar-label">NOURISHNET COMMUNITY</p>
            <h1>
              {activeTab === "available"
                ? "Find food to nourish"
                : "Your food requests"}
            </h1>
          </div>

          <button
            className="refresh-button"
            onClick={loadData}
            disabled={loading}
            aria-label="Refresh dashboard"
          >
            <RefreshCw size={17} />
            Refresh
          </button>
        </header>

        <section className="welcome-banner">
          <div className="welcome-copy">
            <span className="welcome-tag">
              <HandHeart size={15} />
              FOOD FOR EVERYONE
            </span>

            <h2>
              Hello{user?.name
                ? `, ${user.name.split(" ")[0]}`
                : "!"}
              {user?.name ? "!" : ""}
            </h2>

            <p>
              Discover food shared by your community. Every request
              helps good food reach someone who needs it.
            </p>
          </div>

          <div className="welcome-illustration">
            <Leaf size={76} strokeWidth={1.2} />
          </div>
        </section>

        <section className="receiver-stats">
          <article className="stat-card">
            <span className="stat-icon">
              <Utensils size={20} />
            </span>
            <div>
              <strong>{safeDonations.length}</strong>
              <span>Available listings</span>
            </div>
          </article>

          <article className="stat-card">
            <span className="stat-icon">
              <ClipboardList size={20} />
            </span>
            <div>
              <strong>{safeRequests.length}</strong>
              <span>My requests</span>
            </div>
          </article>

          <article className="stat-card">
            <span className="stat-icon">
              <Clock size={20} />
            </span>
            <div>
              <strong>
                {
                  safeRequests.filter(
                    (request) => request.status === "pending"
                  ).length
                }
              </strong>
              <span>Awaiting response</span>
            </div>
          </article>
        </section>

        {error && (
          <div className="dashboard-alert error-alert">
            {error}
            <button
              onClick={() => setError("")}
              aria-label="Dismiss error"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {notice && (
          <div className="dashboard-alert success-alert">
            <CheckCircle size={18} />
            {notice}
            <button
              onClick={() => setNotice("")}
              aria-label="Dismiss message"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {activeTab === "available" ? (
          <section className="food-section">
            <div className="section-heading">
              <div>
                <h2>Available food</h2>
                <p>Explore donations that may be right for you.</p>
              </div>

              <div className="food-search">
                <Search size={18} />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search food or location"
                  aria-label="Search food or location"
                />
              </div>
            </div>

            {loading ? (
              <p className="empty-state">
                Refreshing food listings...
              </p>
            ) : filteredDonations.length === 0 ? (
              <div className="empty-state">
                <Package size={35} />
                <h3>No food listings found</h3>
                <p>
                  Try another search, or check again later for new
                  donations.
                </p>
              </div>
            ) : (
              <div className="food-grid">
                {filteredDonations.map((donation) => (
                  <article
                    className="food-card"
                    key={donation._id}
                  >
                    <div className="food-card-banner">
                      <span className="food-symbol">
                        <Utensils size={25} />
                      </span>
                      <span className="available-badge">
                        Available
                      </span>
                    </div>

                    <div className="food-card-body">
                      <h3>{donation.foodName}</h3>

                      <p className="food-description">
                        {donation.description ||
                          "Shared with care by a community donor."}
                      </p>

                      <div className="food-detail">
                        <Package size={16} />
                        <span>
                          {donation.quantity} {donation.unit}
                        </span>
                      </div>

                      <div className="food-detail">
                        <MapPin size={16} />
                        <span>{donation.pickupLocation}</span>
                      </div>

                      <div className="food-detail">
                        <CalendarDays size={16} />
                        <span>
                          Expires {formatDate(donation.expiryDate)}
                        </span>
                      </div>

                      <div className="food-donor">
                        Shared by{" "}
                        <strong>
                          {donation.donor?.name || "Community donor"}
                        </strong>
                      </div>

                      <button
                        className="request-button"
                        onClick={() => {
                          setSelectedDonation(donation);
                          setQuantity("1");
                          setMessage("");
                          setError("");
                        }}
                      >
                        Request food <HandHeart size={17} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        ) : (
          <section className="food-section">
            <div className="section-heading">
              <div>
                <h2>My requests</h2>
                <p>Keep track of the food you've requested.</p>
              </div>
            </div>

            {loading ? (
              <p className="empty-state">
                Loading your requests...
              </p>
            ) : safeRequests.length === 0 ? (
              <div className="empty-state">
                <ClipboardList size={35} />
                <h3>No requests yet</h3>
                <p>
                  When you request food, it will appear here.
                </p>

                <button
                  className="request-button"
                  onClick={() => setActiveTab("available")}
                >
                  Browse available food
                </button>
              </div>
            ) : (
              <div className="request-list">
                {safeRequests.map((request) => (
                  <article className="request-row" key={request._id}>
                    <div className="request-food-icon">
                      <Utensils size={21} />
                    </div>

                    <div className="request-info">
                      <h3>
                        {request.donation?.foodName || "Food donation"}
                      </h3>

                      <p>
                        Quantity: {request.quantityRequested} ·
                        Requested {formatDate(request.createdAt)}
                      </p>

                      {request.message && (
                        <p className="request-message">
                          “{request.message}”
                        </p>
                      )}
                    </div>

                    <span
                      className={`status-pill ${statusClass(
                        request.status
                      )}`}
                    >
                      {request.status}
                    </span>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        <footer className="receiver-footer">
          NourishNet · Less waste, more care.
        </footer>
      </section>

      {selectedDonation && (
        <div
          className="modal-backdrop"
          onClick={() => setSelectedDonation(null)}
        >
          <section
            className="request-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="request-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={() => setSelectedDonation(null)}
              aria-label="Close request form"
            >
              <X size={20} />
            </button>

            <span className="modal-icon">
              <HandHeart size={25} />
            </span>

            <p className="topbar-label">
              COMMUNITY FOOD REQUEST
            </p>

            <h2 id="request-modal-title">
              Request {selectedDonation.foodName}
            </h2>

            <p className="modal-description">
              {selectedDonation.quantity} {selectedDonation.unit}{" "}
              available · Pickup at {selectedDonation.pickupLocation}
            </p>

            <form onSubmit={submitRequest}>
              <label htmlFor="quantity">
                Quantity to request
              </label>

              <input
                id="quantity"
                type="number"
                min="1"
                max={selectedDonation.quantity}
                step="1"
                value={quantity}
                onChange={(event) =>
                  setQuantity(event.target.value)
                }
                required
              />

              <label htmlFor="request-message">
                Message (optional)
              </label>

              <textarea
                id="request-message"
                value={message}
                onChange={(event) =>
                  setMessage(event.target.value)
                }
                placeholder="Tell the donor anything they should know..."
                rows="3"
              />

              <button
                className="request-button modal-submit"
                type="submit"
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Submit request"}
              </button>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}

export default NGODashboard;
