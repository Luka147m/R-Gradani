
import { Link as LinkIcon } from "lucide-react";

import React from 'react';
import InfoAnalize from './../info-analize.tsx';

interface AnalizaCardProps {
    naslov: string;
    datum: string;
    link: string;
}

function analysisInfo(event: React.MouseEvent<HTMLHeadingElement>) {
    return InfoAnalize();
}



export const AnalizaCard: React.FC<AnalizaCardProps>= ({ naslov, datum, link }) => {

    return(
        <div className="analiza-card">
            <h3 onClick = {analysisInfo}>{naslov}</h3>
            <p className = "datum" >{datum}</p>
            <a href={link} className="link">
                <LinkIcon size = {16} />
                {link}

            </a>
        </div>
    )
}  