import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
import client from "../api/client";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

export default function SiteDetail() {
  const { siteId } = useParams();
  const [metrics, setMetrics] = useState([]);

  useEffect(() => {
    client.get(`/sites/${siteId}/metrics`).then(({ data }) => setMetrics(data));
  }, [siteId]);

  const latest = metrics[metrics.length - 1];
  const labels = metrics.map((m) => new Date(m.date).toLocaleDateString(undefined, { month: "short", year: "2-digit" }));

  const chartData = {
    labels,
    datasets: [
      {
        label: "Carbon (tons)",
        data: metrics.map((m) => m.carbon_tons),
        borderColor: "#2e8b57",
        backgroundColor: "rgba(46,139,87,0.15)",
        tension: 0.3,
      },
    ],
  };

  const bioData = {
    labels,
    datasets: [
      {
        label: "Biodiversity index",
        data: metrics.map((m) => m.biodiversity_index),
        borderColor: "#4169e1",
        backgroundColor: "rgba(65,105,225,0.15)",
        tension: 0.3,
      },
    ],
  };

  return (
    <div>
      <Link to="/dashboard">&larr; Back to dashboard</Link>
      <h2>Site analytics</h2>

      {latest && (
        <div className="metric-cards">
          <div className="metric-card">
            <div className="value">{latest.carbon_tons}</div>
            <div className="label">Carbon (tons, latest)</div>
          </div>
          <div className="metric-card">
            <div className="value">{latest.biodiversity_index}</div>
            <div className="label">Biodiversity index</div>
          </div>
          <div className="metric-card">
            <div className="value">{latest.ndvi}</div>
            <div className="label">NDVI (vegetation health)</div>
          </div>
        </div>
      )}

      <div style={{ background: "white", padding: 20, borderRadius: 10, marginBottom: 20 }}>
        <Line data={chartData} />
      </div>
      <div style={{ background: "white", padding: 20, borderRadius: 10 }}>
        <Line data={bioData} />
      </div>
    </div>
  );
}
