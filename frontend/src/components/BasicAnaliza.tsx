import React from 'react';
import Analysis from '../Analysis.tsx';
import InfoAnalize from '../info-analize.tsx';

interface BasicAnalizaProps {
    key: number;
    naslovAnalize: string;
    naslovSkupaPodataka: string;
    datumKreiranja: Date;
    zadnjaIzmjena?: Date;
    opis: string;
    izdavac: string;
    kategorija: string;
    vidljivost: "javno" | "privatno";
    odobreni: boolean;
}

function extendedAnalysis(event: React.MouseEvent<HTMLHeadingElement>, naslovAnalize: string, naslovSkupaPodataka: string, datumKreiranja: Date, zadnjaIzmjena: Date | undefined, opis: string, izdavac: string, kategorija: string, vidljivost: "javno" | "privatno", odobreni: boolean) {
    return InfoAnalize({ naslovAnalize, naslovSkupaPodataka, datumKreiranja, zadnjaIzmjena, opis, izdavac, kategorija, vidljivost, odobreni });
}

function BasicAnaliza({key, naslovAnalize, naslovSkupaPodataka, datumKreiranja, zadnjaIzmjena, opis, izdavac, kategorija, vidljivost, odobreni }: BasicAnalizaProps) {
    return (
        <div className="basic-analiza">
            <h3 onClick={(event) => extendedAnalysis(event, naslovAnalize, naslovSkupaPodataka, datumKreiranja, zadnjaIzmjena, opis, izdavac, kategorija, vidljivost, odobreni)}>{naslovAnalize}</h3>
            
            <p>Kategorija: {kategorija}</p>
            
            <p>Odobreni: {odobreni ? "Da" : "Ne"}</p>
        </div>
    );
}
export default BasicAnaliza;