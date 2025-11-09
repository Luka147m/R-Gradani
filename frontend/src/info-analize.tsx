
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import type { Analiza } from './Analysis.tsx'
import './HomePage.css'

function InfoAnalize(analiza: Analiza) {

    createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <div className = "main-container-analize">
            <h1>{analiza.naslovAnalize} ({analiza.naslovSkupaPodataka})</h1>
            <p>Kategorije: {analiza.kategorije.map((item, index) => (
                <div key={index} className={index % 2 === 1 ? "kategorija-2" : "kategorija-1"} style={{ display: "inline", marginRight: "1rem" }}>
                    {item}
                </div>
            ))}
            </p>
            <hr/>
            <div className='analiza-all-info'>
                <div className='analiza-opis-kljucne-div'>
                    <div className='analiza-opis-div'>
                        <p><strong>Opis:</strong><br /><br />{analiza.opis}</p><br />
                    </div>
                    <div className='analiza-kljucne-div'>
                        <p><strong>Ključne točke:</strong><br />{analiza.tocke.map((item, index) => (
                            <p key={index}>
                                {item}<br />
                            </p>
                        ))}
                        </p>
                    </div>
                </div>
                <div className='analiza-ostalo-div'>
                    <p>Izdavač: {analiza.izdavac}</p>
                    <p>Vidljivost: {analiza.vidljivost}</p>
                    <div>
                        <p>Datum kreiranja: {analiza.datumKreiranja.toDateString()}</p>
                        {analiza.zadnjaIzmjena && <p>Zadnja izmjena: {analiza.zadnjaIzmjena.toDateString()}</p>}
                    </div>
                    <p>Odobreni: {analiza.odobreni ? "Da" : "Ne"}</p>
                </div>
            </div>
        </div>
    </StrictMode>,
  )
}

export default InfoAnalize;