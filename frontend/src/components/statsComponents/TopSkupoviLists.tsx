import React from "react";
import type { StatsResponseDto } from "../../DTOs/statsDTO";
import { ExternalLink } from "lucide-react";

interface TopSkupoviListsProps {
  skupovi_podataka: StatsResponseDto["skupovi_podataka"];
  maxItems?: number;
}

const TopSkupoviLists: React.FC<TopSkupoviListsProps> = ({ skupovi_podataka, maxItems }) => {
  const sliceItems = <T extends { count: number }>(arr: T[]) =>
    maxItems ? arr.slice(0, maxItems) : arr;

  return (
    <div className="top-skupovi-lists">
      <div className="list-container">
        <h3>Top tagovi</h3>
        <ol>
          {sliceItems(skupovi_podataka.topTags).map((tag) => (
            <li key={tag.tag}>
              <div className="tag-item">
                <span className="tag-name">{tag.tag}</span>
                <span className="tag-count">{tag.count}</span>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="list-container">
        <h3>Top teme</h3>
        <ol>
          {sliceItems(skupovi_podataka.topTheme).map((theme) => (
            <li key={theme.theme}>
              <div className="tag-item">
                <span className="tag-name">{theme.theme}</span>
                <span className="tag-count">{theme.count}</span>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="list-container">
        <h3>Top Skupovi Podataka</h3>
        <ol>
          {sliceItems(skupovi_podataka.topSkupPodataka).map((skup) => (
              <li key={skup.id}>
                <div className="tag-item">
                  <span className="tag-name">{skup.title}</span>
                  <span className="tag-count">{skup.count} komentara</span>
                
                <a
                  href={`https://data.gov.hr/ckan/hr/dataset/${skup.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Otvori dataset"
                  className="dataset-link-icon"
                >
                  <ExternalLink size={16} />
                </a>
                </div>
              </li>
            ))}
        </ol>
      </div>
    </div>
  );
};

export default TopSkupoviLists;
