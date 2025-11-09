import React from 'react';
import Analysis from '../Analysis.tsx';
import InfoAnalize from '../info-analize.tsx';
import '../HomePage.css'

interface BasicAnalizaProps {
    key: number;
    naslovAnalize: string;
    naslovSkupaPodataka: string;
    datumKreiranja: Date;
    zadnjaIzmjena?:  Date;
    opis: string;
    izdavac: string;
    kategorije: string[];
    vidljivost: "javno" | "privatno";
    odobreni: boolean;
    tocke: string[];
}

function extendedAnalysis(event: React.MouseEvent<HTMLHeadingElement>, naslovAnalize: string, naslovSkupaPodataka: string, datumKreiranja: Date, zadnjaIzmjena: Date | undefined, opis: string, izdavac: string, kategorije: string[], vidljivost: "javno" | "privatno", odobreni: boolean, tocke: string[]) {
    return InfoAnalize({ naslovAnalize, naslovSkupaPodataka, datumKreiranja, zadnjaIzmjena, opis, izdavac, kategorije, vidljivost, odobreni, tocke });
}

function BasicAnaliza({key, naslovAnalize, naslovSkupaPodataka, datumKreiranja, zadnjaIzmjena, opis, izdavac, kategorije, vidljivost, odobreni, tocke }: BasicAnalizaProps) {
    return (
        <div className={odobreni ? "odobrena-basic-analiza basic-analiza" : "neodobrena-basic-analiza basic-analiza"} onClick={(event) => extendedAnalysis(event, naslovAnalize, naslovSkupaPodataka, datumKreiranja, zadnjaIzmjena, opis, izdavac, kategorije, vidljivost, odobreni, tocke)}>
            <h2>{naslovAnalize}</h2>
            
            <div className='rest-of-basic-info'>
                <div>
                    <p>Kategorije: {kategorije}</p>
                    {zadnjaIzmjena && <p>Zadnja izmjena: {zadnjaIzmjena.toDateString()}</p>}
                </div>                
            </div>
        </div>
    );
}
export default BasicAnaliza;