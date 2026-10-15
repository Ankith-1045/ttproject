
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Leaf,
  Package,
  ClipboardList,
  Plus,
  LogOut,
  RefreshCw,
  MapPin,
  CalendarDays,
  Utensils,
  CheckCircle,
  XCircle,
  Trash2,
  X,
} from "lucide-react";
import api from "./api/axios";
import "./DonorDashboard.css";

function DonorDashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [donations, setDonations] = useState([]);
  const [requests, setRequests] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    foodName: "",
    description: "",
    quantity: "1",
    unit: "servings",
    pickupLocation: "",
    expiryDate: "",
  });

  const token = () => localStorage.getItem("nourishnetToken");

  const logout = () => {
    localStorage.removeItem("nourishnetToken");
    localStorage.removeItem("nourishnetUser");
    navigate("/");
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    const savedUser = localStorage.getItem("nourishnetUser");
    const savedToken = token();

    if (!savedUser || !savedToken) {
      logout();
      return;
    }

    try {
      const parsedUser = JSON.parse(savedUser);

      if (parsedUser.role !== "donor") {
        setError("Please log in using a donor account.");
        setLoading(false);
        return;
      }

      setUser(parsedUser);

      const headers = {
        Authorization: `Bearer ${savedToken}`,
      };

      const results = await Promise.allSettled([
        api.get("/donations/my", { headers }),
        api.get("/requests/received", { headers }),
      ]);

      if (results[0].status === "fulfilled") {
        const body = results[0].value.data;
        setDonations(
          Array.isArray(body)
            ? body
            : Array.isArray(body?.donations)
              ? body.donations
              : Array.isArray(body?.data)
                ? body.data
                : []
        );
      } else {
        setError(
          results[0].reason?.response?.data?.message ||
            "Could not load your donations."
        );
      }

      if (results[1].status === "fulfilled") {
        const body = results[1].value.data;
        setRequests(
          Array.isArray(body)
            ? body
            : Array.isArray(body?.requests)
              ? body.requests
              : Array.isArray(body?.data)
                ? body.data
                : []
        );
      } else {
        console.error(
          "Could not load received requests:",
          results[1].reason
        );
      }
    } catch (err) {
      console.error(err);
      setError("Could not load your dashboard. Please log in again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const safeDonations = Array.isArray(donations) ? donations : [];
  const safeRequests = Array.isArray(requests) ? requests : [];

  const pendingRequests = safeRequests.filter(
    (request) => request.status === "pending"
  );

  const handleFormChange = (event) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  };

  const createDonation = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");

    if (Number(form.quantity) < 1) {
      setError("Quantity must be at least 1.");
      return;
    }

    setSaving(true);

    try {
      await api.post(
        "/donations",
        {
          ...form,
          quantity: Number(form.quantity),
        },
        {
          headers: {
            Authorization: `Bearer ${token()}`,
          },
        }
      );

      setForm({
        foodName: "",
        description: "",
        quantity: "1",
        unit: "servings",
        pickupLocation: "",
        expiryDate: "",
      });

      setShowForm(false);
      setActiveTab("donations");
      setNotice("Your food donation was added successfully!");
      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not create donation. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const updateRequest = async (requestId, status) => {
    setError("");
    setNotice("");

    try {
      await api.patch(
        `/requests/${requestId}/status`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${token()}`,
          },
        }
      );

      setNotice(`Request ${status} successfully.`);
      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not update this request."
      );
    }
  };

  const deleteDonation = async (donationId) => {
    if (!window.confirm("Are you sure you want to delete this donation?")) {
      return;
    }

    setError("");
    setNotice("");

    try {
      await api.delete(`/donations/${donationId}`, {
        headers: {
          Authorization: `Bearer ${token()}`,
        },
      });

      setNotice("Donation deleted successfully.");
      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not delete this donation."
      );
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

  if (loading && !user) {
    return (
      <div className="donor-loading">
        <Leaf size={34} />
        <p>Preparing your NourishNet donor dashboard...</p>
      </div>
    );
  }

  return (
    <main className="donor-app">
      <aside className="donor-sidebar">
        <div className="donor-brand">
          <span className="donor-brand-icon">
            <Leaf size={24} />
          </span>
          <span>NourishNet</span>
        </div>

        <p className="donor-sidebar-caption">DONOR SPACE</p>

        {[
          ["overview", "Overview", Package],
          ["donations", "My donations", Utensils],
          ["requests", "Food requests", ClipboardList],
        ].map(([tab, label, Icon]) => (
          <button
            key={tab}
            className={`donor-nav-item ${
              activeTab === tab ? "selected" : ""
            }`}
            onClick={() => setActiveTab(tab)}
          >
            <Icon size={19} />
            {label}
            {tab === "requests" && pendingRequests.length > 0 && (
              <span className="donor-nav-count">
                {pendingRequests.length}
              </span>
            )}
          </button>
        ))}

        <div className="donor-sidebar-bottom">
          <div className="donor-sidebar-user">
            <div className="donor-avatar">
              {user?.name?.charAt(0)?.toUpperCase() || "D"}
            </div>
            <div>
              <strong>{user?.name || "Donor"}</strong>
              <span>Food donor</span>
            </div>
          </div>

          <button className="donor-logout" onClick={logout}>
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </aside>

      <section className="donor-main">
        <header className="donor-topbar">
          <div>
            <p className="donor-eyebrow">NOURISHNET COMMUNITY</p>
            <h1>
              {activeTab === "overview"
                ? "Make a difference today"
                : activeTab === "donations"
                  ? "My food donations"
                  : "Manage food requests"}
            </h1>
          </div>

          <button
            className="donor-refresh"
            onClick={loadData}
            disabled={loading}
          >
            <RefreshCw size={17} />
            Refresh
          </button>
        </header>

        <section className="donor-welcome">
          <div>
            <span className="donor-welcome-tag">
              <HandHeartIcon />
              SHARE FOOD, SHARE HOPE
            </span>
            <h2>
              Hello{user?.name ? `, ${user.name.split(" ")[0]}` : ""}!
            </h2>
            <p>
              Your food can make a meaningful difference. Share what
              you have and help reduce food waste in your community.
            </p>
            <button
              className="donor-primary-button"
              onClick={() => setShowForm(true)}
            >
              <Plus size={18} />
              Add a donation
            </button>
          </div>
          <div className="donor-welcome-art">
            <Leaf size={76} strokeWidth={1.2} />
          </div>
        </section>

        {error && (
          <div className="donor-alert donor-error">
            <span>{error}</span>
            <button onClick={() => setError("")} aria-label="Dismiss">
              <X size={17} />
            </button>
          </div>
        )}

        {notice && (
          <div className="donor-alert donor-success">
            <CheckCircle size={18} />
            <span>{notice}</span>
            <button onClick={() => setNotice("")} aria-label="Dismiss">
              <X size={17} />
            </button>
          </div>
        )}

        {activeTab === "overview" && (
          <>
            <section className="donor-stats">
              <article className="donor-stat-card">
                <Package size={22} />
                <div>
                  <strong>{safeDonations.length}</strong>
                  <span>Total donations</span>
                </div>
              </article>
              <article className="donor-stat-card">
                <Utensils size={22} />
                <div>
                  <strong>
                    {
                      safeDonations.filter(
                        (item) => item.status === "available"
                      ).length
                    }
                  </strong>
                  <span>Available listings</span>
                </div>
              </article>
              <article className="donor-stat-card">
                <ClipboardList size={22} />
                <div>
                  <strong>{pendingRequests.length}</strong>
                  <span>Pending requests</span>
                </div>
              </article>
            </section>

            <section className="donor-section">
              <div className="donor-section-heading">
                <div>
                  <h2>Recent donations</h2>
                  <p>Keep track of the food you've shared.</p>
                </div>
                <button
                  className="donor-text-button"
                  onClick={() => setActiveTab("donations")}
                >
                  View all
                </button>
              </div>

              {safeDonations.length === 0 ? (
                <div className="donor-empty">
                  <Package size={34} />
                  <h3>No donations yet</h3>
                  <p>Add your first donation to get started.</p>
                </div>
              ) : (
                <div className="donor-donation-list">
                  {safeDonations.slice(0, 4).map((donation) => (
                    <DonationRow
                      key={donation._id}
                      donation={donation}
                      formatDate={formatDate}
                      onDelete={deleteDonation}
                    />
                  ))}
                </div>
              )}
            </section>

            <section className="donor-section">
              <div className="donor-section-heading">
                <div>
                  <h2>Pending requests</h2>
                  <p>Respond to people requesting your donations.</p>
                </div>
                <button
                  className="donor-text-button"
                  onClick={() => setActiveTab("requests")}
                >
                  View requests
                </button>
              </div>

              <RequestList
                requests={pendingRequests.slice(0, 3)}
                onUpdate={updateRequest}
                formatDate={formatDate}
              />
            </section>
          </>
        )}

        {activeTab === "donations" && (
          <section className="donor-section">
            <div className="donor-section-heading">
              <div>
                <h2>All my donations</h2>
                <p>Manage your food listings.</p>
              </div>
              <button
                className="donor-primary-button"
                onClick={() => setShowForm(true)}
              >
                <Plus size={18} />
                Add donation
              </button>
            </div>

            {safeDonations.length === 0 ? (
              <div className="donor-empty">
                <Package size={34} />
                <h3>No donations yet</h3>
                <p>Your donations will appear here.</p>
              </div>
            ) : (
              <div className="donor-donation-list">
                {safeDonations.map((donation) => (
                  <DonationRow
                    key={donation._id}
                    donation={donation}
                    formatDate={formatDate}
                    onDelete={deleteDonation}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === "requests" && (
          <section className="donor-section">
            <div className="donor-section-heading">
              <div>
                <h2>Requests for my donations</h2>
                <p>Approve or reject pending food requests.</p>
              </div>
            </div>

            <RequestList
              requests={safeRequests}
              onUpdate={updateRequest}
              formatDate={formatDate}
            />
          </section>
        )}

        <footer className="donor-footer">
          NourishNet · Less waste, more care.
        </footer>
      </section>

      {showForm && (
        <div className="donor-modal-backdrop" onClick={() => setShowForm(false)}>
          <section
            className="donor-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="donor-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="donor-modal-close"
              onClick={() => setShowForm(false)}
              aria-label="Close"
            >
              <X size={20} />
            </button>

            <span className="donor-modal-icon">
              <Leaf size={24} />
            </span>
            <p className="donor-eyebrow">SHARE WITH YOUR COMMUNITY</p>
            <h2 id="donor-modal-title">Add a food donation</h2>
            <p className="donor-modal-description">
              Enter accurate details so receivers know what you're sharing.
            </p>

            <form className="donor-form" onSubmit={createDonation}>
              <label htmlFor="foodName">Food name *</label>
              <input
                id="foodName"
                name="foodName"
                value={form.foodName}
                onChange={handleFormChange}
                placeholder="e.g. Fresh rice"
                required
              />

              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleFormChange}
                placeholder="Describe the food"
                rows="3"
              />

              <div className="donor-form-grid">
                <div>
                  <label htmlFor="quantity">Quantity *</label>
                  <input
                    id="quantity"
                    name="quantity"
                    type="number"
                    min="1"
                    value={form.quantity}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="unit">Unit *</label>
                  <select
                    id="unit"
                    name="unit"
                    value={form.unit}
                    onChange={handleFormChange}
                  >
                    <option value="servings">Servings</option>
                    <option value="kg">Kilograms</option>
                    <option value="packets">Packets</option>
                    <option value="boxes">Boxes</option>
                  </select>
                </div>
              </div>

              <label htmlFor="pickupLocation">Pickup location *</label>
              <input
                id="pickupLocation"
                name="pickupLocation"
                value={form.pickupLocation}
                onChange={handleFormChange}
                placeholder="Enter pickup address or area"
                required
              />

              <label htmlFor="expiryDate">Expiry date *</label>
              <input
                id="expiryDate"
                name="expiryDate"
                type="date"
                min={new Date().toISOString().split("T")[0]}
                value={form.expiryDate}
                onChange={handleFormChange}
                required
              />

              <button
                className="donor-primary-button donor-submit"
                type="submit"
                disabled={saving}
              >
                {saving ? "Saving donation..." : "Publish donation"}
              </button>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}

function HandHeartIcon() {
  return <CheckCircle size={15} />;
}

function DonationRow({ donation, formatDate, onDelete }) {
  return (
    <article className="donor-donation-row">
      <div className="donor-row-icon">
        <Utensils size={20} />
      </div>
      <div className="donor-row-info">
        <h3>{donation.foodName}</h3>
        <p>
          {donation.quantity} {donation.unit} ·{" "}
          <MapPin size={14} /> {donation.pickupLocation}
        </p>
        <span className={`donor-status ${donation.status || "available"}`}>
          {donation.status || "available"}
        </span>
        <small>Expires {formatDate(donation.expiryDate)}</small>
      </div>
      <button
        className="donor-delete-button"
        onClick={() => onDelete(donation._id)}
        aria-label={`Delete ${donation.foodName}`}
        title="Delete donation"
      >
        <Trash2 size={17} />
      </button>
    </article>
  );
}

function RequestList({ requests, onUpdate, formatDate }) {
  if (!requests.length) {
    return (
      <div className="donor-empty">
        <ClipboardList size={34} />
        <h3>No requests to show</h3>
        <p>Food requests will appear here when receivers request your donations.</p>
      </div>
    );
  }

  return (
    <div className="donor-request-list">
      {requests.map((request) => (
        <article className="donor-request-row" key={request._id}>
          <div className="donor-row-icon">
            <ClipboardList size={20} />
          </div>
          <div className="donor-row-info">
            <h3>{request.donation?.foodName || "Food donation"}</h3>
            <p>
              Receiver: {request.receiver?.name || "Community receiver"}
            </p>
            <p>
              Quantity requested: {request.quantityRequested}
            </p>
            {request.message && <p>Message: {request.message}</p>}
            <small>Requested {formatDate(request.createdAt)}</small>
            <span className={`donor-status ${request.status || "pending"}`}>
              {request.status || "pending"}
            </span>
          </div>

          {request.status === "pending" && (
            <div className="donor-request-actions">
              <button
                className="donor-approve-button"
                onClick={() => onUpdate(request._id, "approved")}
                title="Approve request"
              >
                <CheckCircle size={17} />
                Approve
              </button>
              <button
                className="donor-reject-button"
                onClick={() => onUpdate(request._id, "rejected")}
                title="Reject request"
              >
                <XCircle size={17} />
                Reject
              </button>
            </div>
          )}
        </article>
      ))}
    </div>
  );
}

export default DonorDashboard;
