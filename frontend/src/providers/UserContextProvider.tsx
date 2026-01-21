import { createContext, useContext } from "react";
import type {
  UserContextType,
  UserContextProviderProps,
} from "./UserContextType";
import useLocalStorageArray from "../hooks/useLocalStorageArray";
import { arrayAddFn, arrayRemoveFn } from "../helper/arraySetterFunctions";

export const UserContext = createContext<UserContextType | undefined>(
  undefined,
);

export const UserContextProvider: React.FC<UserContextProviderProps> = ({
  children,
}) => {
  const [recentlyVisitedDatasets, setRecentlyVisitedDatasets] =
    useLocalStorageArray("recentlyVisitedDatasets");
  const [savedDatasets, setSavedDatasets] =
    useLocalStorageArray("savedDatasets");
  const [savedStatements, setSavedStatements] =
    useLocalStorageArray("savedRequests");
  const [reportedStatements, setReportedStatements] =
    useLocalStorageArray("reportedRequests");

  const addRecentlyVisitedDataset = (id: string) => {
    setRecentlyVisitedDatasets((prev) => [
      id,
      ...prev.filter((i) => i !== id).slice(0, 9),
    ]);
  };

  const addSavedDataset = arrayAddFn(setSavedDatasets);
  const addSavedStatement = arrayAddFn(setSavedStatements);
  const addReportedStatement = arrayAddFn(setReportedStatements);

  const removeSavedDataset = arrayRemoveFn(setSavedDatasets);
  const removeSavedStatement = arrayRemoveFn(setSavedStatements);
  const removeReportedStatement = arrayRemoveFn(setReportedStatements);

  return (
    <UserContext.Provider
      value={{
        recentlyVisitedDatasets,
        savedDatasets,
        savedStatements,
        reportedStatements,
        addRecentlyVisitedDataset,
        addSavedDataset,
        addSavedStatement,
        addReportedStatement,
        removeSavedDataset,
        removeSavedStatement,
        removeReportedStatement,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUserContext must be used within a UserContextProvider");
  }
  return context;
};
