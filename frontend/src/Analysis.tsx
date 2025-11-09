
import './HomePage.css'
import BasicAnaliza from './components/BasicAnaliza.tsx';

class Analiza{
    naslovAnalize: string;
    naslovSkupaPodataka: string;
    datumKreiranja: Date;
    zadnjaIzmjena?: Date;
    opis: string;
    izdavac: string;
    kategorije: string[];
    vidljivost: "javno" | "privatno";
    odobreni: boolean;
    tocke: string[];

    public constructor(naslovAnalize: string, naslovSkupaPodataka: string, datumKreiranja: Date, opis: string, izdavac: string, kategorije: string[], vidljivost: "javno" | "privatno", odobreni: boolean, tocke: string[], zadnjaIzmjena?: Date){
        this.naslovAnalize = naslovAnalize;
        this.naslovSkupaPodataka = naslovSkupaPodataka;
        this.datumKreiranja = datumKreiranja;
        this.opis = opis;
        this.izdavac = izdavac;
        this.kategorije = kategorije;
        this.vidljivost = vidljivost;
        this.odobreni = odobreni;
        this.zadnjaIzmjena = zadnjaIzmjena;
        this.tocke = tocke;
    }


}

const analize1: Analiza[] = [
    new Analiza("Neispravni zaresi", "Korištenje e-usluga u sustavu e-Građani", new Date("2025-01-27"), "Opis analize bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla ", "Izdavač", ["Kvaliteta podataka", "Obuhvat podataka", "Test_kategorija1", "Test_kategorija2", "Test_kategorija3"], "javno", true, ["Tocka 1 Tocka 1 Tocka 1 Tocka 1 Tocka 1 Tocka 1", "Tocka 2 Tocka 2 Tocka 2 Tocka 2 Tocka 2 Tocka 2 Tocka 2 Tocka 2 Tocka 2 Tocka 2 Tocka 2 Tocka 2 Tocka 2 Tocka 2 Tocka 2 Tocka 2 Tocka 2 Tocka 2 Tocka 2 Tocka 2 Tocka 2 Tocka 2 Tocka 2", "Tocka 3 Tocka 3 Tocka 3 Tocka 3 Tocka 3 Tocka 3 Tocka 3 Tocka 3 Tocka 3 Tocka 3 Tocka 3 Tocka 3 Tocka 3 Tocka 3 Tocka 3 Tocka 3 Tocka 3 Tocka 3 Tocka 3 Tocka 3 Tocka 3 Tocka 3 Tocka 3 "], new Date("2025-01-28")),
    new Analiza("Pogrešne adrese", "Adrese u sustavu e-Građani", new Date("2025-02-15"), "Opis analize o pogrešnim adresama u sustavu e-Građani.", "Državni zavod za statistiku", ["Točnost podataka"], "privatno", false,["Tocka 1 Tocka 1 Tocka 1 Tocka 1 Tocka 1 Tocka 1", "Tocka 2 Tocka 2 Tocka 2 Tocka 2 Tocka 2 Tocka 2 Tocka 2 Tocka 2 Tocka 2 Tocka 2 Tocka 2 Tocka 2 Tocka 2 Tocka 2 Tocka 2 Tocka 2 Tocka 2 Tocka 2 Tocka 2 Tocka 2 Tocka 2 Tocka 2 Tocka 2", "Tocka 3 Tocka 3 Tocka 3 Tocka 3 Tocka 3 Tocka 3 Tocka 3 Tocka 3 Tocka 3 Tocka 3 Tocka 3 Tocka 3 Tocka 3 Tocka 3 Tocka 3 Tocka 3 Tocka 3 Tocka 3 Tocka 3 Tocka 3 Tocka 3 Tocka 3 Tocka 3 "], undefined),
    new Analiza("Nedostajući podaci o korisnicima", "Korisnički podaci u sustavu e-Građani", new Date("2025-03-10"), "Ova analiza istražuje nedostajuće podatke o korisnicima u sustavu e-Građani.", "Ministarstvo uprave", ["Potpunost podataka"], "javno", true, ["Tocka 1 Tocka 1 Tocka 1 Tocka 1 Tocka 1 Tocka 1", "Tocka 2 Tocka 2 Tocka 2 Tocka 2 Tocka 2 Tocka 2 Tocka 2 Tocka 2 Tocka 2 Tocka 2 Tocka 2 Tocka 2 Tocka 2 Tocka 2 Tocka 2 Tocka 2 Tocka 2 Tocka 2 Tocka 2 Tocka 2 Tocka 2 Tocka 2 Tocka 2", "Tocka 3 Tocka 3 Tocka 3 Tocka 3 Tocka 3 Tocka 3 Tocka 3 Tocka 3 Tocka 3 Tocka 3 Tocka 3 Tocka 3 Tocka 3 Tocka 3 Tocka 3 Tocka 3 Tocka 3 Tocka 3 Tocka 3 Tocka 3 Tocka 3 Tocka 3 Tocka 3 "], new Date("2025-03-12")),
];




function Analysis({ naslov }: { naslov: string }) {
    return (
        <div className="main-container">
            <header>
                <h1>Sve dostupne analize za skup podataka: <label className='ime-skupa'>{naslov}</label></h1>
            </header>
            <div className='sve-analize-skupa-div'>
                {analize1?.map((analiza, index) => (
                    <BasicAnaliza
                        key={index}
                        naslovAnalize={analiza.naslovAnalize}
                        naslovSkupaPodataka={analiza.naslovSkupaPodataka}
                        datumKreiranja={analiza.datumKreiranja}
                        zadnjaIzmjena={analiza.zadnjaIzmjena}
                        opis={analiza.opis}
                        izdavac={analiza.izdavac}
                        kategorije={analiza.kategorije}
                        vidljivost={analiza.vidljivost}
                        odobreni={analiza.odobreni}
                        tocke={analiza.tocke}
                    />
                    ))}
            </div>
        </div>
    );
    
}

export default Analysis;   
export type { Analiza }; 
