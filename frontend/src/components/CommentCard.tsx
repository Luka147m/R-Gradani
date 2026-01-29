import React, { useState } from "react";
import { CommentBubble } from "./CommentBubble";

import { Sparkles, TextSelect, MessageCircleDashed } from "lucide-react";
import "../style/DatasetPage.css";

import { FetchedReplies } from "../types/fetchedReplies";

interface CommentCardProps {
  user_id: number;
  subject: string;
  message: string; // HTML content
  created: string;
  replies: FetchedReplies[];
  comment_index: number;
  comment_total: number;
}

const CommentCard: React.FC<CommentCardProps> = ({
  user_id,
  subject,
  message,
  created,
  replies,
  comment_index,
  comment_total,
}) => {
  const [selectedHomeProfile, setSelectedHomeProfile] = useState<
    "home" | "profile"
  >("home");
  const [selectedComment, setSelectedComment] = useState<
    "AISearch" | "normalSearch"
  >("AISearch");
  console.log(subject);
  console.log(created);
  console.log(selectedHomeProfile);
  console.log(setSelectedHomeProfile);
  if (replies.length === 0) {
    return (
      <div className="analysis-card">
        <div className="user-info">
          <MessageCircleDashed />
          {user_id}
        </div>
        <div className="comments-flex">
          <div className="comment-bubble-normal">
            <p dangerouslySetInnerHTML={{ __html: message }}></p>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="analysis-card">
      <div className="user-info">
        <MessageCircleDashed />
        <span>Korisnik: {user_id}</span>
        <span>
          (Komentar {comment_index} od {comment_total})
        </span>
      </div>
      <div className="AI-normal-selector">
        <button
          className={`selector-btn ${
            selectedComment === "AISearch" ? "active-AISearch" : ""
          }`}
          onClick={() => setSelectedComment("AISearch")}
        >
          <Sparkles size={24} />
        </button>

        <button
          className={`selector-btn profile-btn ${
            selectedComment === "normalSearch" ? "active-normalSearch" : ""
          }`}
          onClick={() => setSelectedComment("normalSearch")}
        >
          <TextSelect size={24} />
        </button>
      </div>
      <div className="comments-flex">
        {selectedComment === "normalSearch" ? (
          <div className="comment-bubble-normal">
            <p dangerouslySetInnerHTML={{ __html: message }}></p>
          </div>
        ) : (
          replies.map((reply, replyIndex) => (
            <div key={replyIndex} style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #e0e0e0' }}>
              {reply.message?.izjave?.map((reply) => {
                return (
                  <>
                    <CommentBubble
                      content={reply.text || ""}
                      isFromComment={true}
                      usvojenost={reply.analysis?.usvojenost || false}
                      podudarnost={reply.analysis?.podudarnost || 0}
                    />
                    <CommentBubble
                      content={reply.analysis?.komentar || ""}
                      isFromComment={false}
                      usvojenost={reply.analysis?.usvojenost || false}
                      podudarnost={reply.analysis?.podudarnost || 0}
                    />
                  </>
                );
              })}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CommentCard;
