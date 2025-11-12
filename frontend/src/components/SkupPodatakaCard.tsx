import { Link as LinkIcon , Bookmark } from "lucide-react";
import { Link } from "react-router-dom";
import React from 'react';

import {useState, useEffect} from 'react';



interface SkupPodatakaCardProps {
    id: string;
    naslov: string;
    datum: string;
    link: string;
}

export const SkupPodatakaCard: React.FC<SkupPodatakaCardProps> = ({ id, naslov, datum, link }) => {

    const [isSaved, setIsSaved] = useState(false);
    useEffect(() => {
        try{
            const raw = localStorage.getItem('savedDatasets');
            const arr: string[] = raw ? JSON.parse(raw) : [];
            setIsSaved(arr.includes(id));
        } catch{
            setIsSaved(false);
        }
    }, [id]);

    const toggleSave = () => {
        try{
            const raw = localStorage.getItem('savedDatasets');
            const arr: string[] = raw ? JSON.parse(raw) : [];
            if(arr.includes(id)){
                const filtered = arr.filter(x => x !== id);
                localStorage.setItem('savedDatasets', JSON.stringify(filtered));
                setIsSaved(false);
            }else {
                arr.push(id);
                localStorage.setItem('savedDatasets', JSON.stringify(arr));
                setIsSaved(true);
            }       
        } catch(e){
            console.error("Error u localStorage-u:", e);
        }
    };

    const updateRecentlyVisited = () => {
        try{
            const raw = localStorage.getItem('recentlyVisitedDatasets');
            const arr: string[] = raw ? JSON.parse(raw) : [];
            if(!arr.includes(id)){
                arr.push(id);
                localStorage.setItem('recentlyVisitedDatasets', JSON.stringify(arr));
                setIsSaved(true);
            }       
        } catch(e){
            console.error("Error u localStorage-u:", e);
        }
    }

    return (
        <div className="skup-podataka-card" data-id={id}>
            <Link 
                to={`/dataset/${encodeURIComponent(id)}`} 
                style={{ color: 'inherit', textDecoration: 'none' }}
                onClick={updateRecentlyVisited}
                state={{ id, name: naslov, url: link, created: datum }}>
                <h3 onClick={updateRecentlyVisited}>{naslov}</h3>
            </Link>
            <p className="datum">{datum}</p>
            <a href={link} className="link" target="_blank" rel="noreferrer">
                <LinkIcon size={16} />
                {link}
            </a>
            <div className="save-icon-dataset">
                <Bookmark 
                    size={20} 
                    onClick={toggleSave} 
                    color={isSaved ? '#28a745' : undefined}
                    fill={isSaved ? '#28a745' : 'none'}
                />
            </div>
        </div>
    );
};