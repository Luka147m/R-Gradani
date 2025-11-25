import { PublisherCard} from './Publishercard';
import './IzdvojeniSkupoviPodataka.css';
import { Building } from 'lucide-react';
import '../HomePage.css'
import { mockInitData }  from '../mockData';

export const RecentPublishers = () => {

    const publishersData = mockInitData.result.publishers;
    const datasets = mockInitData.result.latestDatasets;

    // Funkcija koja broji datasete po publisheru
    const getDatasetCount = (publisherId: string): number => {
        return datasets.filter(dataset => dataset.publisher_id === publisherId).length;
    };

    return (
        <div className = "search-skupovi-div">
            <div className='ikona-naslov-div'>
                <Building className='ikona' />
                <h1 className='search-skupovi-h1'>Nedavno aktivni izdavači</h1>
            </div>
            <div className="recent-publishers-div">
                {publishersData.map((publisher) => (
                    <PublisherCard
                        key={publisher.id}
                        id={publisher.id}
                        name={publisher.title}
                        numOfDatasets={getDatasetCount(publisher.id)}
                    />
                ))}
            </div>
            
        </div>
    );
};
