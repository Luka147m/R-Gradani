import React, { useState } from "react";
import "./Button.css";

type ApiButtonProps = {
  apiCall: () => Promise<unknown>;
  children: React.ReactNode;
  className?: string;
};

const ApiButton: React.FC<ApiButtonProps> = ({ apiCall, children, className = "" }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setLoading(true);
    setError(null);
    try {
      await apiCall();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="api-button-wrapper">
      <button onClick={handleClick} disabled={loading} className={`btn ${className}`}>
        {loading ? "Loading..." : children}
      </button>
      {error && <div className="error">{error}</div>}
    </div>
  );
};

export default ApiButton;