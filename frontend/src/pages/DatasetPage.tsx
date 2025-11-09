import { useParams } from "react-router-dom";

const DatasetPage = () => {
  const { id } = useParams(); // npr. id = "123"
  return <h1>Dataset ID: {id}</h1>;
};
export default DatasetPage;