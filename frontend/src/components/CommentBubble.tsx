import React, {useState, useEffect} from 'react';
import {Bookmark, Flag} from 'lucide-react';

import "../style/CommentBubble.css"

interface RequestData {
    content: string;
    isFromComment: boolean;
    usvojenost: boolean;
    podudarnost: number;
}

interface CommentBubbleProps{
    content: string,
    isFromComment: boolean,
    usvojenost: boolean,
    podudarnost: number,
    isProfilePage?: boolean
}

export const CommentBubble: React.FC<CommentBubbleProps> = ({ content, isFromComment, usvojenost, podudarnost, isProfilePage = false }) => {

    const [saved, setSaved] = useState(false);
    const [reported, setReported] = useState(false);

    const requestData: RequestData = { content, isFromComment, usvojenost, podudarnost };

    useEffect(() => {
        try{
            const raw = localStorage.getItem('savedRequests');
            const arr: RequestData[] = raw ? JSON.parse(raw) : [];
            setSaved(arr.some(req => req.content === content));
        } catch{
            setSaved(false);
        }
    }, [content]);

    useEffect(() => {
        try{
            const raw = localStorage.getItem('reportedRequests');
            const arr: RequestData[] = raw ? JSON.parse(raw) : [];
            setReported(arr.some(req => req.content === content));
        } catch{
            setReported(false);
        }
    }, [content]);

    const toggleReport = () => {
        try{
            const raw = localStorage.getItem('reportedRequests');
            const arr: RequestData[] = raw ? JSON.parse(raw) : [];
            if(arr.some(req => req.content === content)){
                const filtered = arr.filter(req => req.content !== content);
                localStorage.setItem('reportedRequests', JSON.stringify(filtered));
                setReported(false);
            }else {
                arr.push(requestData);
                localStorage.setItem('reportedRequests', JSON.stringify(arr));
                setReported(true);
            }       
        } catch(e){
            console.error("Error na localStorage-u", e);
        }
    }

    const toggleSave = () => {
        try{
            const raw = localStorage.getItem('savedRequests');
            const arr: RequestData[] = raw ? JSON.parse(raw) : [];
            if (arr.some(req => req.content === content)){
                const filtered = arr.filter(req => req.content !== content);
                localStorage.setItem('savedRequests', JSON.stringify(filtered));
                setSaved(false);
            }else{
                arr.push(requestData);
                localStorage.setItem('savedRequests', JSON.stringify(arr));
                setSaved(true);
            }
        } catch(e) {
            console.error('Error na localStorage-u', e);
        }
    }

    const getStatusConfig = () => {
        if (podudarnost <= 25) {
            return {label: "Usvojeno", className: "status-success"};
        }
        if (podudarnost <= 60) {
            return {label: "Djelomično usvojeno", className: "status-warning"};
        }
        return {label: "Nije usvojeno", className: "status-error"};
    };

    const status = getStatusConfig();

    return (
        <div className={`comment ${isProfilePage ? 'comment-profile' : ''} ${isFromComment ? "left" : "right"}`}>
            {!isFromComment && (
                <div className={`usvojenost-status-strip ${status.className}`} />
            )}
            {isFromComment ? (
                <div className="icons-top-right">
                    <Bookmark 
                        className={`save-icon ${saved ? 'saved' : ''}`} 
                        onClick={toggleSave}
                        color={saved ? '#28a745' : undefined}
                        fill={saved ? '#28a745' : 'none'}
                    />
                    <Flag 
                        className={`report-icon ${reported ? 'reported' : ''}`} 
                        onClick={toggleReport}
                        color={reported ? '#CF6679' : undefined}
                        fill={reported ? '#CF6679' : 'none'}
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


                        <hr/>
                        <div className="podudarnost-wrapper">
                            <div
                                className="podudarnost-tooltip"
                                data-tooltip={`Istinitost originalnog komentara: ${podudarnost}%`}
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

                )}</div>
        </div>
    )
}