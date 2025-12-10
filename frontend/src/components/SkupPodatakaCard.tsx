import { Link as LinkIcon , Bookmark } from "lucide-react";
import { Link } from "react-router-dom";
import React from 'react';

import {useState, useEffect} from 'react';
import {DataSet} from '../types/dataset'

export const SkupPodatakaCard: React.FC<DataSet> = (props) => {
    const { id, title, url, created } = props;
    const dataset = { title, url, created };

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
                state={{ id, name: dataset.title, url: dataset.url, created: dataset.created }}>
                <h3 onClick={updateRecentlyVisited}>{dataset.title}</h3>
            </Link>
            <p className="datum">{dataset.created instanceof Date ? dataset.created.toLocaleDateString() : dataset.created}</p>
            <a href={dataset.url || '#'} className="link" target="_blank" rel="noreferrer">
                <LinkIcon size={16} />
                {dataset.url}
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