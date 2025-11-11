import { Link as LinkIcon } from "lucide-react";
import { Link } from "react-router-dom";
import React from 'react';

interface SkupPodatakaCardProps {
    id: string;
    naslov: string;
    datum: string;
    link: string;
}

export const SkupPodatakaCard: React.FC<SkupPodatakaCardProps> = ({ id, naslov, datum, link }) => {
    return (
        <div className="skup-podataka-card" data-id={id}>
            <Link 
                to={`/dataset/${encodeURIComponent(id)}`} 
                style={{ color: 'inherit', textDecoration: 'none' }}
                state={{ id, name: naslov, url: link, created: datum }}>
                <h3>{naslov}</h3>
            </Link>
            <p className="datum">{datum}</p>
            <a href={link} className="link" target="_blank" rel="noreferrer">
                <LinkIcon size={16} />
                {link}
            </a>
        </div>
    );
};