import { SkupPodatakaCard} from './SkupPodatakaCard';
import '../style/IzdvojeniSkupoviPodataka.css';
import { Bookmark } from 'lucide-react';
import '../style/HomePage.css'
import { mockInitData }  from '../mockData.ts';


export const MarkedDatasets = () => {

    const datasets = mockInitData.result.latestDatasets;
    
    const arr = JSON.parse(localStorage.getItem('savedDatasets') || '[]');
    const markedDatasets = datasets.filter(skup => arr.includes(skup.id));

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
                        naslov={skupPodataka.title}
                        datum={skupPodataka.created}
                        link={skupPodataka.url}
                    />
                ))}
            </div>
            
        </div>
    );
};
