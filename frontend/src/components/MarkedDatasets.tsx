import { SkupPodatakaCard} from './SkupPodatakaCard';
import '../style/IzdvojeniSkupoviPodataka.css';
import { Bookmark } from 'lucide-react';
import '../style/HomePage.css'
import { DataSet } from '../types/dataset';
import { useEffect, useState } from 'react';
import api from '../api/axios.tsx'


export const MarkedDatasets = () => {
    const [markedDatasets, setMarkedDatasets] = useState<DataSet[]>([]);

    useEffect(() => {
        const fetchMarkedDatasets = async () => {
            const arr = JSON.parse(localStorage.getItem('savedDatasets') || '[]');
            if (arr.length === 0) return;
            const response = await api.post('/skupovi/ids', { ids: arr });
            setMarkedDatasets(response.data);
        };
        fetchMarkedDatasets();
}, []);

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
                        {...skupPodataka}
                    />
                ))}
            </div>
            
        </div>
    );
};
