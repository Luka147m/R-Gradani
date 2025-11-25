import { SkupPodatakaCard} from './SkupPodatakaCard';
import './IzdvojeniSkupoviPodataka.css';
import { History } from 'lucide-react';
import '../HomePage.css'
import { mockInitData }  from '../mockData.ts';
/* import { Heading1 } from 'lucide-react'; */

export const RecentlyVisitedDatasets = () => {

    

    const datasets = mockInitData.result.latestDatasets;

    const arr = JSON.parse(localStorage.getItem('recentlyVisitedDatasets') || '[]');
    const markedDatasets = datasets.filter(skup => arr.includes(skup.id));

    return (
        <div className = "search-skupovi-div">
            <div className='ikona-naslov-div'>
                <History className='ikona' />
                <h1 className='search-skupovi-h1'>Nedavno posjećeni skupovi podataka</h1>
            </div>
            <div className="skupovi-podataka-grid">
                {markedDatasets.map((skupPodataka) => (
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
