import { Link as LinkIcon } from "lucide-react";
import { Link } from "react-router-dom";
import React from 'react';

interface SkupPodatakaCardProps {
    naslov: string;
    datum: string; 
    link: string;
}

export const SkupPodatakaCard: React.FC<SkupPodatakaCardProps>= ({ naslov, datum, link }) => {
    return(
        <div className="skup-podataka-card">
            <Link to={`/dataset/${encodeURIComponent(naslov)}`} style={{color: 'white', textDecoration: 'none'}}>
                <h3>{naslov}</h3>
            </Link>
            <p className="datum">{datum}</p>
            <a href={link} className="link">
                <LinkIcon size={16} />
                {link}
            </a>
        </div>
    )
}