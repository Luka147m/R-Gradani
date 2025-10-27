import React from 'react';
import { AnalizaCard } from './AnalizaCard';
import './IzdvojeniSkupoviPodataka.css';

export const IzdvojeniSkupoviPodataka = () => {

    const analize = [
        {
        naslov: "Korištenje e-usluga u sustavu e-Građani",
        datum: "27. 1. 2025.",
        link: "https://data.gov.hr",
        },
        {
        naslov: "hgadhuadkjvg",
        datum: "27. 1. 2025.",
        link: "https://data.gov.hr",
        },
        {
        naslov: "Kankjkkdistenje e-usluga u sustavu e-Građani",
        datum: "27. 1. 2025.",
        link: "https://data.gov.hr",
        },
        {
        naslov: "HAHAHAHAHAHHHAHAHAHA",
        datum: "27. 1. 2025.",
        link: "https://data.gov.hr",
        }, {
        naslov: "avu e-Građani",
        datum: "27. 1. 2025.",
        link: "https://data.gov.hr",
        },
         {
        naslov: "Korištenje e-usluga u sustavu e-Građani",
        datum: "27. 1. 2025.",
        link: "https://data.gov.hr",
        },
         {
        naslov: "Korištenje e-usluga u sustavu e-Građani",
        datum: "27. 1. 2025.",
        link: "https://data.gov.hr",
        },
        
        
    ];

    return (
        <div className = "izdvojene-analize">
            <h2>
                Izdvojene analize
            </h2>
            <div className="analize-grid">
                {analize.map((analiza, index) => (
                    <AnalizaCard
                        key={index}
                        naslov={analiza.naslov}
                        datum={analiza.datum}
                        link={analiza.link}
                    />
                ))}
            </div>
            
        </div>
    );
};
