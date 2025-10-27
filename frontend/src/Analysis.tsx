
import './App.css'
import BasicAnaliza from './components/BasicAnaliza.tsx';

class Analiza{
    naslovAnalize: string;
    naslovSkupaPodataka: string;
    datumKreiranja: Date;
    zadnjaIzmjena?: Date;
    opis: string;
    izdavac: string;
    kategorija: string;
    vidljivost: "javno" | "privatno";
    odobreni: boolean;

    public constructor(naslovAnalize: string, naslovSkupaPodataka: string, datumKreiranja: Date, opis: string, izdavac: string, kategorija: string, vidljivost: "javno" | "privatno", odobreni: boolean, zadnjaIzmjena?: Date){
        this.naslovAnalize = naslovAnalize;
        this.naslovSkupaPodataka = naslovSkupaPodataka;
        this.datumKreiranja = datumKreiranja;
        this.opis = opis;
        this.izdavac = izdavac;
        this.kategorija = kategorija;
        this.vidljivost = vidljivost;
        this.odobreni = odobreni;
        this.zadnjaIzmjena = zadnjaIzmjena;
    }


}

const analize1: Analiza[] = [
    new Analiza("Neispravni zaresi", "Korištenje e-usluga u sustavu e-Građani", new Date("2025-01-27"), "Opis analize bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla ", "Izdavač", "Kvaliteta podataka, Obuhvat podataka", "javno", true, new Date("2025-01-28")),
    new Analiza("Pogrešne adrese", "Adrese u sustavu e-Građani", new Date("2025-02-15"), "Opis analize o pogrešnim adresama u sustavu e-Građani.", "Državni zavod za statistiku", "Točnost podataka", "privatno", false),
    new Analiza("Nedostajući podaci o korisnicima", "Korisnički podaci u sustavu e-Građani", new Date("2025-03-10"), "Ova analiza istražuje nedostajuće podatke o korisnicima u sustavu e-Građani.", "Ministarstvo uprave", "Potpunost podataka", "javno", true, new Date("2025-03-12")),
];




function Analysis({ naslov }: { naslov: string }) {
    return (
        <div className="main-container">
            <header>
                <h1>{naslov}</h1>
            </header>
            <div>
                {analize1?.map((analiza, index) => (
                    <BasicAnaliza
                        key={index}
                        naslovAnalize={analiza.naslovAnalize}
                        naslovSkupaPodataka={analiza.naslovSkupaPodataka}
                        datumKreiranja={analiza.datumKreiranja}
                        zadnjaIzmjena={analiza.zadnjaIzmjena}
                        opis={analiza.opis}
                        izdavac={analiza.izdavac}
                        kategorija={analiza.kategorija}
                        vidljivost={analiza.vidljivost}
                        odobreni={analiza.odobreni}
                       
                    />
                    ))}
            </div>
        </div>
    );
    
}

export default Analysis;   
export type { Analiza }; 
