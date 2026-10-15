
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Login from "./Login";
import ReceiverDashboard from "./ReceiverDashboard";
import DonorDashboard from "./DonorDashboard";

function ProtectedDashboard({ role }) {
  const token = localStorage.getItem("nourishnetToken");
  const savedUser = localStorage.getItem("nourishnetUser");

  if (!token || !savedUser) {
    return <Navigate to="/" replace />;
  }

  try {
    const user = JSON.parse(savedUser);

    if (user.role !== role) {
      return <Navigate to="/" replace />;
    }

    return role === "donor" ? (
      <DonorDashboard />
    ) : (
      <ReceiverDashboard />
    );
  } catch {
    localStorage.removeItem("nourishnetToken");
    localStorage.removeItem("nourishnetUser");
    return <Navigate to="/" replace />;
  }
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route
          path="/dashboard"
          element={<ProtectedDashboard role="receiver" />}
        />

        <Route
          path="/donor-dashboard"
          element={<ProtectedDashboard role="donor" />}
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
