import React from "react";
import type { PublisherCount } from "../../DTOs/statsDTO";


interface TopIzdavaciDatasetsListProps {
  izdavaci: PublisherCount[];
  maxItems?: number;
}

const TopIzdavaciDatasetsList: React.FC<TopIzdavaciDatasetsListProps> = ({ izdavaci, maxItems }) => {
  const sorted = [...izdavaci].sort((a, b) => b.count - a.count);
  const list = maxItems ? sorted.slice(0, maxItems) : sorted;

  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
    <div className="list-container" style={{ width: '70%' }}>
    <ol>
      {list.map((pub) => (
        <li key={pub.publisher}>
          <div className="tag-item">
          <span className="tag-name">{pub.publisher}</span>
          <span className="tag-count">{pub.count} skupova podataka</span>
          </div>
        </li>
      ))}
    </ol>
    </div>
    </div>
  );
};

export default TopIzdavaciDatasetsList;
