import { SkupPodatakaCard} from './SkupPodatakaCard';
import './IzdvojeniSkupoviPodataka.css';
import { Bookmark } from 'lucide-react';
import '../HomePage.css'
/* import { Heading1 } from 'lucide-react'; */

export const MarkedDatasets = () => {

    // Primjer podataka koji odgovaraju tvojoj DB shemi (skup: id (UUID), url, name)
    const skupoviPodataka = [
        {
            id: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
            name: "Korištenje e-usluga u sustavu e-Građani",
            url: "https://data.gov.hr/datasets/egov-services",
            created: "2025-01-27"
        },
        {
            id: "9a3b2e7e-1c4b-4f8b-9c5f-1e2d3f4a5b6c",
            name: "Otvoreni podaci o prijevozu",
            url: "https://data.gov.hr/datasets/transport",
            created: "2024-12-10"
        },
        {
            id: "2d5f6e7a-4b2c-11ec-81d3-0242ac130003",
            name: "Demografski statistički podaci",
            url: "https://data.gov.hr/datasets/demographics",
            created: "2023-08-05"
        },
        {
            id: "a1b2c3d4-e5f6-7a8b-9c0d-111213141516",
            name: "Javne financije - proračun",
            url: "https://data.gov.hr/datasets/budget",
            created: "2024-06-01"
        },
        {
            id: "c0ffee00-0000-4000-8000-000000000001",
            name: "Registri - poslovni subjekti",
            url: "https://data.gov.hr/datasets/business-registry",
            created: "2022-11-20"
        },
        {
            id: "7f3e2d1c-9b8a-4d3c-8e7f-222222222222",
            name: "Okolišni indikatori",
            url: "https://data.gov.hr/datasets/environment",
            created: "2025-01-10"
        }
    ];

    const arr = JSON.parse(localStorage.getItem('savedDatasets') || '[]');
    const markedDatasets = skupoviPodataka.filter(skup => arr.includes(skup.id));

    return (
        <div className = "search-skupovi-div">
            <div className='ikona-naslov-div'>
                <Bookmark className='ikona' />
                <h1 className='search-skupovi-h1'>Zabilježeni skupovi podataka</h1>
            </div>
            <div className="skupovi-podataka-grid">
                {markedDatasets.map((skupPodataka) => (
                    <SkupPodatakaCard
                        key={skupPodataka.id}
                        id={skupPodataka.id}
                        naslov={skupPodataka.name}
                        datum={skupPodataka.created}
                        link={skupPodataka.url}
                    />
                ))}
            </div>
            
        </div>
    );
};
