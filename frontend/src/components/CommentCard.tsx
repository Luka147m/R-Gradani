import React, { useState } from 'react';
import { CommentBubble } from './CommentBubble';

import {Sparkles, TextSelect, HatGlasses} from 'lucide-react';
import '../style/DatasetPage.css';

import type { Reply } from '../Reply';



interface CommentCardProps {
    user_id: number;
    subject: string;
    message: string; // HTML content
    created: string;
    replies: Reply[];
}

const CommentCard: React.FC<CommentCardProps> = ({ user_id, subject, message, created, replies }) => {
    const [selectedHomeProfile, setSelectedHomeProfile] = useState<"home" | "profile">("home");
    const [selectedComment, setSelectedComment] = useState<"AISearch" | "normalSearch">("AISearch");
    console.log(subject)
    console.log(created)
    console.log(selectedHomeProfile)
    console.log(setSelectedHomeProfile)
    return (
        <div className="analysis-card">
            <div className="user-info">
                <HatGlasses />
                {user_id}
            </div>
            <div className="AI-normal-selector">
                <button
                className={`selector-btn ${selectedComment === "AISearch" ? "active-AISearch" : ""}`}
                onClick={() => setSelectedComment("AISearch")}
                >
                <Sparkles size={24} />
                </button>

                <button
                className={`selector-btn profile-btn ${selectedComment === "normalSearch" ? "active-normalSearch" : ""}`}
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
                    replies.map((reply: Reply) => (
                        <>
                            <CommentBubble 
                                key={reply.id}
                                content={reply.reply}
                                isFromComment={true}
                            />
                            <CommentBubble 
                                key={reply.id}
                                content={reply.message}
                                isFromComment={false}
                            />
                        </>
                    ))
                )}  
            
       

            </div>

            
            
            
        </div>
    );
}

export default CommentCard;