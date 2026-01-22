import { Link as LinkIcon, Bookmark } from "lucide-react";
import { Link } from "react-router-dom";
import React, { useMemo } from "react";

import { DataSet } from "../types/dataset";
import { useUserContext } from "../providers/UserContextProvider";

export const DatasetCard: React.FC<DataSet> = (props) => {
  const { id, title, url, created } = props;
  const dataset = { title, url, created };

  const { savedDatasets, addSavedDataset, removeSavedDataset } =
    useUserContext();

  const isStored = useMemo(
    () => savedDatasets.includes(id),
    [id, savedDatasets],
  );

  const toggleSave = () => {
    if (isStored) {
      removeSavedDataset(id);
    } else {
      addSavedDataset(id);
    }
  };

  return (
    <div className="skup-podataka-card" data-id={id}>
      <Link
        to={`/dataset/${encodeURIComponent(id)}`}
        style={{ color: "inherit", textDecoration: "none" }}
        state={{
          id,
          name: dataset.title,
          url: dataset.url,
          created: dataset.created,
        }}
      >
        <h3 style={{ width: "88%" }}>{dataset.title}</h3>
      </Link>
      <p className="datum">
        {dataset.created instanceof Date
          ? dataset.created.toLocaleDateString()
          : dataset.created}
      </p>
      <a
        href={dataset.url || "#"}
        className="link"
        target="_blank"
        rel="noreferrer"
      >
        <LinkIcon size={16} />
        {dataset.url}
      </a>
      <div className="save-icon-dataset">
        <Bookmark
          className={`save-icon ${isStored ? "saved" : ""}`}
          onClick={toggleSave}
          color={isStored ? "var(--secondary)" : undefined}
          fill={isStored ? "var(--secondary)" : "none"}
          strokeWidth={2.5}
          size={30}
        />
      </div>
    </div>
  );
};
