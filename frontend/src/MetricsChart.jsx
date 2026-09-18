
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function MetricsChart({ metrics = [] }) {
  const carbonMetrics = metrics.filter(
    (metric) =>
      metric.metric_type?.toLowerCase() === "carbon"
  );

  const data = {
    labels: carbonMetrics.map((metric, index) =>
      metric.created_at
        ? new Date(metric.created_at).toLocaleDateString()
        : `Record ${index + 1}`
    ),
    datasets: [
      {
        label: "Carbon (tCO₂e)",
        data: carbonMetrics.map((metric) =>
          Number(metric.value)
        ),
        borderColor: "#16a34a",
        backgroundColor: "#16a34a",
        tension: 0.3,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: "Carbon Metrics Over Time",
      },
    },
  };

  if (carbonMetrics.length === 0) {
    return <p>No carbon metrics available yet.</p>;
  }

  return (
    <div className="bg-white p-4 rounded-xl shadow">
      <Line data={data} options={options} />
    </div>
  );
}

export default MetricsChart;