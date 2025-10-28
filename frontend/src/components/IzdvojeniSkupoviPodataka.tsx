import React from 'react';
import { SkupPodatakaCard} from './SkupPodatakaCard';
import './IzdvojeniSkupoviPodataka.css';
import { Heading1 } from 'lucide-react';

export const IzdvojeniSkupoviPodataka = () => {

    const skupoviPodataka = [
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
        }

        
        
    ];

    return (
        <div className = "izdvojeni-skupovi-podataka">
            <h1>
                Izdvojeni skupovi podataka
            </h1>
            <div className="skupovi-podataka-grid">
                {skupoviPodataka.map((skupPodataka, index) => (
                    <SkupPodatakaCard
                        key={index}
                        naslov={skupPodataka.naslov}
                        datum={skupPodataka.datum}
                        link={skupPodataka.link}
                    />
                ))}
            </div>
            
        </div>
    );
};
