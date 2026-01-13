import { useParams, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import CommentCard from "../components/CommentCard";
import ApiButton from "../components/ApiButton";
import {MessageCircle} from "lucide-react";
import "../style/DatasetPage.css";
//import type { Reply } from "../Reply";
import { Comment } from "../types/comment"
import { FetchedReplies } from "../types/fetchedReplies";
import api from "../api/axios"

type DatasetState = {
  id?: string;
  name?: string;
  url?: string;
  created?: string;
};

const DatasetPage = () => {
  const [error, setError] = useState<string | null>(null);
  console.log(error, setError)
  const params = useParams();
  const location = useLocation();
  const state = (location.state || {}) as DatasetState;
  
  const id = state.id ?? params.id;
  const name = state.name ?? params.name;
  const url = state.url ?? params.url;
  const created = state.created ?? params.created;
  console.log(created)

  const [comments, setComments] = useState<Comment[]>([]);
  useEffect(() => {
      api.get(`/skupovi/${id}/komentari`).then((response) => {
          setComments(response.data);
      });
  }, [id]);

  const [replies, setReplies] = useState<FetchedReplies[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function loadAnswers() {
      try {
        // For all comments, create an array of promises:
        const answerPromises = comments.map((comment) =>
          api.get(`/odgovori/komentar/${comment.id}`)
        );

        // Run all requests in parallel
        const results = await Promise.all(answerPromises);

        // Extract data from each response
        const allAnswers: FetchedReplies[] = results.flatMap(
          (res) => res.data
        );
        console.log(allAnswers);
        setReplies(allAnswers);
      } catch (err) {
        console.error("Failed to fetch answers:", err);
      } finally {
        setLoading(false);
      }
    }

    if (comments.length > 0) {
      loadAnswers();
    }

  }, [comments]);


  const datasetRefresh = () => {
    const pageRefresh = async () => {
      try {
        await api.post(`/skupovi/${id}/refresh`);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Something went wrong";
        setError(message);
      }
    }
    return pageRefresh();
  }

  return (
    <div className="main-container">
      <h1 className="dataset-title">{name}</h1>
      <a href={url}><h3 className="dataset-url">{url}</h3></a>
      <ApiButton apiCall={datasetRefresh} className="api-button">Osvježi</ApiButton>
      <label className="pregled-komentara-lable">
        <MessageCircle size={24} /> 
        <h2>Pregled komentara</h2>
      </label>

      <div className="comments">
        {loading && <p>Loading analyses...</p>}
        {comments.map((comment, index) => (
          <>
            <label htmlFor="" className="commentIndex">Komentar {index + 1} / {comments.length}</label>

            <CommentCard
              key={comment.id}
              user_id={Number(comment.user_id) || 0}
              subject={String(comment.subject)}
              message={String(comment.message)}
              created={comment.created ? new Date(comment.created).toISOString() : ""}
              replies={replies.filter(reply => reply.komentar_id === comment.id)} />
          </>
        ))}

      </div>
    </div>
  );
};

export default DatasetPage;