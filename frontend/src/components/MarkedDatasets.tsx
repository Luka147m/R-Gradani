import { DatasetCard } from "./DatasetCard.tsx";
import { useState, useEffect } from "react";
import "../style/IzdvojeniSkupoviPodataka.css";
import { Bookmark, CloudUpload } from "lucide-react";
import "../style/HomePage.css";
import api from "../api/axios.tsx";
import type { getDatasetDTO } from "../DTOs/getDatasetDTO.ts";
import ApiButton from "./ApiButton.tsx";
import IconText from "./IconText.tsx";

export const MarkedDatasets = () => {
  const [markedDatasets, setMarkedDatasets] = useState<getDatasetDTO[]>([]);
  const [importIsSelected, setImportIsSelected] = useState<boolean>(false);
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    const fetchMarkedDatasets = async () => {
      const arr = JSON.parse(localStorage.getItem("savedDatasets") || "[]");
      if (arr.length === 0) return;
      const response = await api.post("/skupovi/ids", { ids: arr });
      setMarkedDatasets(response.data);
    };
    fetchMarkedDatasets();
  }, []);

  const importComments = () => {
    setImportIsSelected(true);
  };

  const checkFileType = (fileInt: File | null) => {
    if (fileInt && !fileInt.name.endsWith(".mbz")) {
      alert("Datoteka mora biti u .mbz formatu.");
      setFile(null);
      return;
    }
    setFile(fileInt);
  };

  const submitImport = async () => {
    if (!file) {
      alert("Nije odabran niti jedan file.");
      return;
    }

    await api.post("/upload", file, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    setImportIsSelected(false);
    setFile(null);
  };

  return (
    <>
      <div className="search-skupovi-div">
        <div className="ikona-naslov-div">
          <Bookmark className="ikona" />
          <h1 className="search-skupovi-h1">Zabilježeni skupovi podataka</h1>
        </div>
        {markedDatasets.length > 0 ? (
          <div className="skupovi-podataka-grid marked-datasets">
            {markedDatasets.map((skupPodataka) => (
              <DatasetCard key={skupPodataka.id} {...skupPodataka} />
            ))}
          </div>
        ) : (
          <div>Nema zabilježenih skupova podataka.</div>
        )}
        <div className="button-wrapper">
          <button onClick={importComments} className="api-button import-button">
            <IconText
              icon={CloudUpload}
              text="Objavi analize skupova podataka"
            ></IconText>
          </button>
        </div>
      </div>

      {importIsSelected && (
        <div className="overlay">
          <div className="import-modal">
            <h2>Uvoz zabilježenih skupova podataka</h2>
            <button
              className="import-modal-close-button"
              onClick={() => setImportIsSelected(false)}
            >
              x
            </button>
            <input
              type="file"
              accept=".mbz"
              onChange={(e) =>
                checkFileType(e.target.files ? e.target.files[0] : null)
              }
            />
            <ApiButton apiCall={submitImport} className="api-button">
              Potvrdi
            </ApiButton>
          </div>
        </div>
      )}
    </>
  );
};
