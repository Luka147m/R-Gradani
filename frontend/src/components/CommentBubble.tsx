import React, { useState, useEffect } from "react";
import { Bookmark, Flag } from "lucide-react";
import { useParseLocalStorage } from "../providers/useParseLocalStorage.tsx";

import "../style/CommentBubble.css";

interface RequestData {
  content: string;
  isFromComment: boolean;
  usvojenost: boolean;
  podudarnost: number;
}

interface CommentBubbleProps {
  content: string;
  isFromComment: boolean;
  usvojenost: boolean;
  podudarnost: number;
  isProfilePage?: boolean;
}

export const CommentBubble: React.FC<CommentBubbleProps> = ({
  content,
  isFromComment,
  usvojenost,
  podudarnost,
  isProfilePage = false,
}) => {
  const [savedRequests, setSavedRequests] = useParseLocalStorage<RequestData>(
    "savedRequests",
    [],
  );
  const [reportedRequests, setReportedRequests] =
    useParseLocalStorage<RequestData>("reportedRequests", []);

  const [saved, setSaved] = useState(false);
  const [reported, setReported] = useState(false);

  const requestData: RequestData = {
    content,
    isFromComment,
    usvojenost,
    podudarnost,
  };

  useEffect(() => {
    if (Array.isArray(savedRequests)) {
      setSaved(savedRequests.some((req) => req.content === content));
    } else {
      setSaved(false);
    }
  }, [content, savedRequests]);

  useEffect(() => {
    if (Array.isArray(reportedRequests)) {
      setReported(reportedRequests.some((req) => req.content === content));
    } else {
      setReported(false);
    }
  }, [content, reportedRequests]);

  const toggleReport = () => {
    setReportedRequests((current) => {
      const arr = Array.isArray(current) ? current : [];
      const exists = arr.some((req) => req.content === content);
      const next = exists
        ? arr.filter((req) => req.content !== content)
        : [...arr, requestData];
      setReported(!exists);
      return next;
    });
  };

  const toggleSave = () => {
    setSavedRequests((current) => {
      const arr = Array.isArray(current) ? current : [];
      const exists = arr.some((req) => req.content === content);
      const next = exists
        ? arr.filter((req) => req.content !== content)
        : [...arr, requestData];
      setSaved(!exists);
      return next;
    });
  };

  const getStatusConfig = () => {
    if (podudarnost <= 25) {
      return { label: "Usvojeno", className: "status-success" };
    }
    if (podudarnost <= 60) {
      return { label: "Djelomično usvojeno", className: "status-warning" };
    }
    return { label: "Nije usvojeno", className: "status-error" };
  };

  const status = getStatusConfig();

  return (
    <div
      className={`comment ${isProfilePage ? "comment-profile" : ""} ${isFromComment ? "left" : "right"}`}
    >
      {!isFromComment && (
        <div className={`usvojenost-status-strip ${status.className}`} />
      )}
      {isFromComment ? (
        <div className="icons-top-right">
          <Bookmark
            className={`save-icon ${saved ? "saved" : ""}`}
            onClick={toggleSave}
            color={saved ? "var(--correct)" : undefined}
            fill={saved ? "var(--correct)" : "none"}
          />
          <Flag
            className={`report-icon ${reported ? "reported" : ""}`}
            onClick={toggleReport}
            color={reported ? "var(--error)" : undefined}
            fill={reported ? "var(--error)" : "none"}
          />
        </div>
      ) : null}

      {!isFromComment && (
        <div className={`usvojenost-status-box ${status.className}`}>
          {status.label}
        </div>
      )}

      <div className="text-box">
        <p dangerouslySetInnerHTML={{ __html: content }}></p>
        {isFromComment ? null : (
          <div className="icons-bottom-left">
            <hr />
            <div className="podudarnost-wrapper">
              <div
                className="podudarnost-tooltip"
                data-tooltip={`Istinitost originalne izjave: ${podudarnost}%`}
              >
                <div className="podudarnost-bar">
                  <div
                    className={`podudarnost-fill ${status.className}`}
                    style={{ width: `${podudarnost}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
