
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import type { Analiza } from './Analysis.tsx'


// naslovAnalize: string;
//     naslovSkupaPodataka: string;
//     datumKreiranja: Date;
//     zadnjaIzmjena?: Date;
//     opis: string;
//     izdavac: string;
//     kategorija: string;
//     vidljivost: "javno" | "privatno";
//     odobreni: boolean;


function InfoAnalize(analiza: Analiza) {

    createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <div className = "main-container">
            <h1>{analiza.naslovAnalize}</h1>
            <p>Naslov skupa podataka: {analiza.naslovSkupaPodataka}</p>
            <p>Datum kreiranja: {analiza.datumKreiranja.toDateString()}</p>
            {analiza.zadnjaIzmjena && <p>Zadnja izmjena: {analiza.zadnjaIzmjena.toDateString()}</p>}
            <p>Opis: {analiza.opis}</p>
            <p>Izdavač: {analiza.izdavac}</p>
            <p>Kategorija: {analiza.kategorija}</p>
            <p>Vidljivost: {analiza.vidljivost}</p>
            <p>Odobreni: {analiza.odobreni ? "Da" : "Ne"}</p>
        </div>
    </StrictMode>,
  )
}

export default InfoAnalize;