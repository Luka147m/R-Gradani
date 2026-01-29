import { useParams, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import CommentCard from '../components/CommentCard';
import ApiButton from '../components/ApiButton';
import { Database, RefreshCw } from 'lucide-react';
import '../style/DatasetPage.css';
//import type { Reply } from "../Reply";
import { getCommentRepliesDTO } from '../DTOs/getCommentRepliesDTO.ts';
import { getCommentDTO } from '../DTOs/getCommentDTO.ts';
import { DatasetState } from '../DTOs/datasetStateDTO.ts';
import api from '../api/axios';
import IconText from '../components/IconText.tsx';
import { AnalyzeDatasetContainer } from '../components/AnalyzeDatasetContainer.tsx';
import { AxiosError } from "axios";
import { Bookmark } from "lucide-react";

const DatasetPage = () => {
  const [error, setError] = useState<string | null>(null);
  const [isAddingComement, setIsAddingComment] = useState(false);
  const [newCommentTitle, setNewCommentTitle] = useState('');
  const [newCommentText, setNewCommentText] = useState('');
  console.log(error, setError);
  const params = useParams();
  const location = useLocation();
  const state = (location.state || {}) as DatasetState;

  // id skupa
  const id = state.id ?? params.id;
  const name = state.name ?? params.name;
  const url = state.url ?? params.url;
  const created = state.created ?? params.created;
  console.log("DEBUG, " ,id, created);

  const [comments, setComments] = useState<getCommentDTO[]>([]);
  useEffect(() => {
    api.get(`/skupovi/${id}/komentari`).then((response) => {
      setComments(response.data);
    });
  }, [id]);

  const [replies, setReplies] = useState<getCommentRepliesDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const STORAGE_KEY = "savedDatasets";

  const [saved, setSaved] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const raw = localStorage.getItem(STORAGE_KEY);
    const savedIds: (string | undefined)[] = raw ? JSON.parse(raw) : [];
    return savedIds.includes(id);
  });
  
  useEffect(() => {
    async function loadAnswers() {
      setLoading(true);
      setError(null);

      try {
        const answerPromises = comments.map((comment) =>
          api.get<getCommentRepliesDTO[]>(`/odgovori/komentar/${comment.id}`)
        );

        const results = await Promise.allSettled(answerPromises);

        const allAnswers: getCommentRepliesDTO[] = [];
        const notFoundComments: getCommentDTO[] = [];

        results.forEach((result, index) => {
          if (result.status === "fulfilled") {
            allAnswers.push(...result.value.data);
          } else {
            const error = result.reason as AxiosError;

            if (error.response?.status === 404) {
              notFoundComments.push(comments[index]);
              console.log(`No answers found for comment ID: ${comments[index].id}`);
            } else {
              console.error("Unexpected error:", error);
            }
          }
        });

        setReplies(allAnswers);
        /*
        if (notFoundComments.length > 0) {
          setError(`No answers found for comments:${notFoundComments}`);
        }
        results.forEach((result, index) => {
          console.log(index, result.status);
        });
        */
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
      await api.post(`/skupovi/${id}/refresh`);

      const response = await api.get(`/skupovi/${id}/komentari`);
      setComments(response.data);
    };
    return pageRefresh();
  };

  const submitAddComment = () => {
    const addComment = async () => {
      if (newCommentTitle.trim() === '' || newCommentText.trim() === '') {
        alert('Naslov i tekst komentara ne smiju biti prazni.');
        return;
      }
      api.post(`/komentari`, {
        title: newCommentTitle,
        message: newCommentText,
        skup_id: id,
      });

      setIsAddingComment(false);
      const response = await api.get(`/skupovi/${id}/komentari`);
      setComments(response.data);
    };
    return addComment();
  };


  function toggleSaveDataset() {
    const raw = localStorage.getItem(STORAGE_KEY);
    const savedIds: (string | undefined)[] = raw ? JSON.parse(raw) : [];

    const exists = savedIds.includes(id);

    const updated = exists
      ? savedIds.filter((savedId) => savedId !== id)
      : [...savedIds, id];

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    setSaved(!exists);
  }


  return (
    <div className="main-container">
      {/* <Link to="/"><HomeIcon size={24} className="home-redirect-icon" /></Link> */}

      <div className="dataset-header" style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', width: '90%' }}>
        <IconText
          icon={Database}
          iconSize={30}
          text={name || ''}
          className="dataset-title"
          style={{ justifySelf: 'center', gridColumn: '2' }}
        ></IconText>

        <Bookmark
          className={`save-icon ${saved ? "saved" : ""}`}
          onClick={toggleSaveDataset}
          color={saved ? "var(--correct)" : undefined}
          fill={saved ? "var(--correct)" : "none"}
          style={{ cursor: 'pointer', width: '30px', height: '30px', justifySelf: 'end', gridColumn: '3' }}
        />

      </div>
      <span className="dataset-created">
          Kreirano: {created ? new Date(created).toLocaleDateString() : 'N/A'}
      </span>
      
      <a href={url}>
        <h3 className="dataset-url">{url}</h3>
      </a>

      <ApiButton apiCall={datasetRefresh} className="api-button">
        <IconText
          icon={RefreshCw}
          text={`Osvježi informacije o skupu podataka`}
        ></IconText>
      </ApiButton>

      {/* <label className="pregled-komentara-lable">
        <MessageCircle size={24} /> 
        <h2>Pregled komentara</h2>
      </label> */}
      {/* <ApiButton 
        apiCall={() => setIsAddingComment(true)} 
        className="add-comment-button">
        Dodaj komentar

      </ApiButton> */}

      {id && <AnalyzeDatasetContainer skupId={id} />}

      {isAddingComement && (
        <div className="add-comment-overlay">
          <div className="add-comment-card">
            <button
              className="close-button"
              onClick={() => setIsAddingComment(false)}
            >
              ✕
            </button>
            <h2 style={{ fontSize: '2em' }}>Dodavanje komentara</h2>
            <input
              type="text"
              placeholder="Naslov komentara..."
              className="comment-input"
              onChange={(e) => setNewCommentTitle(e.target.value)}
            />
            <textarea
              placeholder="Unesite komentar..."
              className="comment-textarea"
              onChange={(e) => setNewCommentText(e.target.value)}
            />
            <ApiButton className="submit-button" apiCall={submitAddComment}>
              Pošalji
            </ApiButton>
          </div>
        </div>
      )}

      <div className="comments">
        {loading && <p>Loading analyses...</p>}
        {comments.map((comment, index) => (
          <>
            {/* <label htmlFor="" className="commentIndex">
              Komentar {index + 1} / {comments.length}
            </label> */}

            <CommentCard
              key={index+1}
              user_id={Number(comment.user_id) || 0}
              subject={String(comment.subject)}
              message={String(comment.message)}
              created={
                comment.created ? new Date(comment.created).toISOString() : ''
              }
              replies={replies.filter(
                (reply) => reply.komentar_id === comment.id,
              )}
              comment_index={index + 1}
              comment_total={comments.length}
            />
          </>
        ))}
      </div>
    </div>
  );
};

export default DatasetPage;
