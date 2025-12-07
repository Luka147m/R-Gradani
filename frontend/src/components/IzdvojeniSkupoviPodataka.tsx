import { SkupPodatakaCard} from './SkupPodatakaCard';
import '../style/IzdvojeniSkupoviPodataka.css';
import { BadgeAlert } from 'lucide-react';
import '../style/HomePage.css'

import { mockInitData }  from '../mockData.ts';

export const IzdvojeniSkupoviPodataka = () => {

    
    const datasets = mockInitData.result.latestDatasets;

    return (
        <div className = "search-skupovi-div">
            <div className='ikona-naslov-div'>
                <BadgeAlert className='ikona' />
                <h1 className='search-skupovi-h1'>Nedavno obrađeni skupovi podataka</h1>
            </div>
            <div className="skupovi-podataka-grid">
                {datasets.map((skupPodataka) => (
                    <SkupPodatakaCard
                        key={skupPodataka.id}
                        id={skupPodataka.id}
                        naslov={skupPodataka.title}
                        datum={skupPodataka.created}
                        link={skupPodataka.url}
                    />
                ))}
            </div>
            
        </div>
    );
};
