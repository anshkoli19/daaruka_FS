import { Outlet, Link, useNavigate } from "react-router-dom";

export default function App() {
  const navigate = useNavigate();
  const token = localStorage.getItem("darukaa_token");

  const logout = () => {
    localStorage.removeItem("darukaa_token");
    navigate("/login");
  };

  return (
    <div>
      <header className="topbar">
        <Link to="/dashboard" className="brand">
          Darukaa.Earth
        </Link>
        {token && (
          <button onClick={logout} className="logout-btn">
            Log out
          </button>
        )}
      </header>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
