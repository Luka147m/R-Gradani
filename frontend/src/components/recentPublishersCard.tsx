import { PublisherCard} from './Publishercard';
import './IzdvojeniSkupoviPodataka.css';
import { Building } from 'lucide-react';
import '../HomePage.css'
/* import { Heading1 } from 'lucide-react'; */

export const RecentPublishers = () => {

    // Primjer podataka koji odgovaraju tvojoj DB shemi (skup: id (UUID), url, name)
    const publishers = [
        {
            id: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
            name: "Grad Zagreb",
            description: "",
            numOfDatasets: 207
        },
        {
            id: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
            name: "Ministarstvo Unutarnjih Poslova",
            description: "",
            numOfDatasets: 288
        },
        {
            id: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
            name: "Grad Rovinj-Rovingo",
            description: "",
            numOfDatasets: 65
        }
        
    ];

    return (
        <div className = "search-skupovi-div">
            <div className='ikona-naslov-div'>
                <Building className='ikona' />
                <h1 className='search-skupovi-h1'>Nedavno aktivni izdavači</h1>
            </div>
            <div className="recent-publishers-div">
                {publishers.map((publ) => (
                    <PublisherCard
                        id={publ.id}
                        name={publ.name}
                        description={publ.description}
                        numOfDatasets={publ.numOfDatasets}
                    />
                ))}
            </div>
            
        </div>
    );
};
