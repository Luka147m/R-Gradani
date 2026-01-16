import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from "recharts";

interface ScoreBucket {
  score: number;
  count: number;
}

interface ScoreHistogramProps {
  data: ScoreBucket[];
}

const ScoreHistogram: React.FC<ScoreHistogramProps> = ({ data }) => {
  return (
    <div>
      <h3>Histogram ocjena odgovora</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="score" label={{ value: "Score", position: "insideBottom", offset: -5 }} />
          <YAxis label={{ value: "Count", angle: -90, position: "insideLeft", offset: 10 }} />
          <Tooltip />
          <Bar dataKey="count" fill="#FF8042">
            <LabelList dataKey="count" position="top" />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ScoreHistogram;
