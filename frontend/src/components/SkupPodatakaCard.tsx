
import { Link as LinkIcon } from "lucide-react";

import React from 'react';
import AnalizeSkupa from '../analize-skupa.tsx';

interface SkupPodatakaCardProps {
    naslov: string;
    datum: string;
    link: string;
}

function analysisInfo(event: React.MouseEvent<HTMLHeadingElement>, naslov: string) {
    return AnalizeSkupa(naslov);
}


export const SkupPodatakaCard: React.FC<SkupPodatakaCardProps>= ({ naslov, datum, link }) => {

    return(
        <div className="skup-podataka-card">
            <h3 onClick = {(e) => analysisInfo(e, naslov)}>{naslov}</h3>
            <p className = "datum" >{datum}</p>
            <a href={link} className="link">
                <LinkIcon size = {16} />
                {link}

            </a>
        </div>
    )
}  