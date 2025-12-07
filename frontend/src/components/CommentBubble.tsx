
import React, {useState, useEffect} from 'react';
import {Bookmark, Flag} from 'lucide-react';

import "../style/CommentBubble.css"

interface CommentBubbleProps{
   
    content: string,
    isFromComment: boolean
}

export const CommentBubble: React.FC<CommentBubbleProps> = ({ content, isFromComment }) => {

    const [saved, setSaved] = useState(false);
    const [reported, setReported] = useState(false);



    useEffect(() => {
        try{

            const raw = localStorage.getItem('savedRequests');
            const arr: string[] = raw ? JSON.parse(raw) : [];
            setSaved(arr.includes(content));

        } catch{
            setSaved(false);

        }

    }, [content]);

    useEffect(() => {
        try{
            const raw = localStorage.getItem('reportedRequests');
            const arr: string[] = raw ? JSON.parse(raw) : [];
            setReported(arr.includes(content));

        
        } catch{
            setReported(false);
        }
    }, [content]);

    const toggleReport = () => {
        try{
            const raw = localStorage.getItem('reportedRequests');
            const arr: string[] = raw ? JSON.parse(raw) : [];
            if(arr.includes(content)){
                const filtered = arr.filter(x => x !== content);
                localStorage.setItem('reportedRequests', JSON.stringify(filtered));
                setReported(false);
            }else {
                arr.push(content);
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
            const arr: string[] = raw ? JSON.parse(raw) : [];
            if (arr.includes(content)){
                const filtered = arr.filter(x => x !== content);
                localStorage.setItem('savedRequests', JSON.stringify(filtered));
                setSaved(false);
            }else{
                arr.push(content);
                localStorage.setItem('savedRequests', JSON.stringify(arr));
                setSaved(true);

            }
        } catch(e) {
            console.error('Error na localStorage-u', e);
        }
    }


    return (
        <div className={`comment ${isFromComment ? "left" : "right"}`}>
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

            <div className="text-box">
                <p dangerouslySetInnerHTML={{ __html: content }}></p>
            </div>
            
        </div>
    )
}