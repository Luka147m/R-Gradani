import React from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface CommentPieChartProps {
  total: number;
  obradenih: number;
}

const COLORS = ["#00C49F", "#FF8042"];

const CommentPieChart: React.FC<CommentPieChartProps> = ({ total, obradenih }) => {
  const data = [
    { name: "Obrađeni", value: obradenih },
    { name: "Neobrađeni", value: total - obradenih },
  ];

  return (
    <div className="pie-chart-wrapper">
    <h2>Komentari: obrađeni vs. neobrađeni</h2>
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
        Ukupno komentara: {total}
    </p>
    </div>
  );
};

export default CommentPieChart;