import React, { useState } from "react";
import { CommentBubble } from "./CommentBubble";

import { Sparkles, TextSelect, MessageCircleDashed } from "lucide-react";
import "../style/DatasetPage.css";

import { FetchedReplies } from "../types/fetchedReplies";

interface CommentCardProps {
  subject: string;
  message: string; // HTML content
  created: string;
  replies: FetchedReplies[];
  comment_id: string;
}

const CommentCard: React.FC<CommentCardProps> = ({
  subject,
  message,
  created,
  replies,
  comment_id
}) => {
  const [selectedHomeProfile, setSelectedHomeProfile] = useState<
    "home" | "profile"
  >("home");
  const [selectedComment, setSelectedComment] = useState<
    "AISearch" | "normalSearch"
  >("AISearch");
  const [selectedNotAnalyzedComment, setSelectedNotAnalyzedComment] = useState<
    "AISearch" | "normalSearch"
  >("normalSearch");
  console.log(subject);
  console.log(created);
  console.log(selectedHomeProfile);
  console.log(setSelectedHomeProfile);
  if (replies.length === 0) {
    return (
      <div className="analysis-card">
        <div className="comments-flex2">
          <div className="comment-bubble-normal" style={{ width: "100%", display: "flex", flexDirection: "column", gap: "8px",height: "fit-content"  }}>
            <div className="user-inf" style={{display: "flex",
  flexDirection: "row",
  alignItems: "center",
  gap: "8px",
  fontSize: "1.2rem",
  color: "#bbbbbb"}}>
              <MessageCircleDashed />
              <span >ID: {comment_id}</span>
            </div>
            <div className="AI-normal-selector">
              <button
                className={`selector-btn ${
                  selectedNotAnalyzedComment === "AISearch" ? "active-AISearch" : ""
                }`}
                onClick={() => setSelectedNotAnalyzedComment("normalSearch")}
              >
                <Sparkles size={24}/>
              </button>

              <button
                className={`selector-btn profile-btn ${
                  selectedNotAnalyzedComment === "normalSearch" ? "active-normalSearch" : ""
                }`}
                onClick={() => setSelectedNotAnalyzedComment("normalSearch")}
              >
                <TextSelect size={24} />
              </button>
            </div>
            <p dangerouslySetInnerHTML={{ __html: message }}></p>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="analysis-card">
      <div className="user-info" style={{ paddingTop: "8px" }}>
        <MessageCircleDashed />
        <span >ID: {comment_id}</span>
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
          replies.map((reply) =>
            reply.message?.izjave?.map((reply) => {
              return (
                <>
                  <CommentBubble
                    key={reply.id}
                    content={reply.text || ""}
                    isFromComment={true}
                    usvojenost={reply.analysis?.usvojenost || false}
                    podudarnost={reply.analysis?.podudarnost || 0}
                  />
                  <CommentBubble
                    key={reply.id}
                    content={reply.analysis?.komentar || ""}
                    isFromComment={false}
                    usvojenost={reply.analysis?.usvojenost || false}
                    podudarnost={reply.analysis?.podudarnost || 0}
                  />
                </>
              );
            })
          )
        )}
      </div>
    </div>
  );
};

export default CommentCard;
