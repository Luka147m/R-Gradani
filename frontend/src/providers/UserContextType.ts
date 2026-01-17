import type { ReactNode } from "react";

export interface UserContextType {
  recentlyVisitedDatasets: string[];
  savedDatasets: string[];
  savedStatements: string[];
  reportedStatements: string[];

  addRecentlyVisitedDataset: (dataset: string) => void;
  addSavedDataset: (datasetId: string) => void;
  addSavedStatement: (statementId: string) => void;
  addReportedStatement: (statementId: string) => void;

  removeSavedDataset: (datasetId: string) => void;
  removeSavedStatement: (statementId: string) => void;
  removeReportedStatement: (statementId: string) => void;
}

export interface UserContextProviderProps {
  children: ReactNode;
}
