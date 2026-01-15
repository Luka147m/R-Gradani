import React from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface EntryPieChartProps {
  total: number;
  usvojeno: number;
}

const COLORS = ["#00C49F", "#FF8042"];

const EntryPieChart: React.FC<EntryPieChartProps> = ({ total: total, usvojeno: usvojeno }) => {
  const neusvojeno = total - usvojeno;

  const data = [
    { name: "Usvojeno", value: usvojeno },
    { name: "Neusvojeno", value: neusvojeno },
  ];

  return (
    <div className="pie-chart-wrapper">
      <h2>Izjave: usvojeno vs. neusvojeno</h2>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
            label
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
      <p style={{ textAlign: "center", marginTop: "0.5rem" }}>
        Ukupno izjava: {total}
      </p>
    </div>
  );
};

export default EntryPieChart;
