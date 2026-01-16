import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import type { CategoryReportItem } from "../../DTOs/statsDTO";

interface CategoryReportProps {
  categoryReport: CategoryReportItem[];
  maxItems?: number;
}

const CategoryReport: React.FC<CategoryReportProps> = ({ categoryReport, maxItems }) => {
  const sorted = [...categoryReport].sort((a, b) => b.count - a.count);
  const list = maxItems ? sorted.slice(0, maxItems) : sorted;
  
  return (
    <div className="category-report">
      <ol>
        {list.map((cat) => {
          const data = [
            { 
              name: cat.category,
              usvojeni: cat.usvojeni,
              neusvojeni: cat.count - cat.usvojeni
            }
          ];
          
          return (
            <li key={cat.category} className="category-item">
              <div className="category-title">{cat.category} ({cat.count})</div>
              <div className="category-bar">
                <ResponsiveContainer width="100%" height={30}>
                  <BarChart data={data} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <XAxis type="number" hide domain={[0, cat.count]} />
                    <YAxis type="category" dataKey="name" hide />
                    <Tooltip
                        content={({ payload }) => {
                          if (payload && payload.length > 0) {
                            const usvojeni = payload.find(p => p.dataKey === 'usvojeni')?.value || 0;
                            const neusvojeni = payload.find(p => p.dataKey === 'neusvojeni')?.value || 0;
                            return (
                              <div style={{ backgroundColor: 'white', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}>
                                <div style={{ color: '#00C49F' }}>
                                  Usvojeni: {usvojeni} ({((usvojeni / cat.count) * 100).toFixed(1)}%)
                                </div>
                                <div style={{ color: '#FF8042' }}>
                                  Neusvojeni: {neusvojeni} ({((neusvojeni / cat.count) * 100).toFixed(1)}%)
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                    />
                    <Bar dataKey="usvojeni" stackId="a" fill="#00C49F" />
                    <Bar dataKey="neusvojeni" stackId="a" fill="#FF8042" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
};

export default CategoryReport;