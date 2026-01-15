import React from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface ResponsesPieChartProps {
  count: number;
  failed: number;
}

const COLORS = ["#00C49F", "#FF8042"];

const OdgovoriPieChart: React.FC<ResponsesPieChartProps> = ({ count, failed }) => {
  const total = count + failed;

  const data = [
    { name: "Uspješno", value: count },
    { name: "Neuspješno", value: failed },
  ];

  return (
    <div className="pie-chart-wrapper">
      <h2>Analize: uspješno vs. neuspješno</h2>
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
        Ukupno analiza: {total}
      </p>
    </div>
  );
};

export default OdgovoriPieChart;
