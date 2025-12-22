import { DatasetCard} from './DatasetCard.tsx';
import '../style/IzdvojeniSkupoviPodataka.css';
import { History } from 'lucide-react';
import '../style/HomePage.css'
import { useState, useEffect } from 'react';
import api from '../api/axios.tsx'
import type { DataSet } from '../types/dataset.ts';
/* import { Heading1 } from 'lucide-react'; */

export const RecentlyVisitedDatasets = () => {

    

    const [recentlyVisitedDatasets, setRecentlyVisitedDatasets] = useState<DataSet[]>([]);
    useEffect(() => {
        const fetchRecentlyVisitedDatasets = async () => {
            const arr = JSON.parse(localStorage.getItem('recentlyVisitedDatasets') || '[]');
            if (arr.length === 0) return;
            const response = await api.post('/skupovi/ids', { ids: arr });
            setRecentlyVisitedDatasets(response.data);
        };
        fetchRecentlyVisitedDatasets();
    }, []);

    return (
        <div className = "search-skupovi-div">
            <div className='ikona-naslov-div'>
                <History className='ikona' />
                <h1 className='search-skupovi-h1'>Nedavno posjećeni skupovi podataka</h1>
            </div>
            <div className="skupovi-podataka-grid">
                {recentlyVisitedDatasets.map((skupPodataka) => (
                    <DatasetCard
                            key={skupPodataka.id}
                            {...skupPodataka}
                        />
                ))}
            </div>
            
        </div>
    );
};
