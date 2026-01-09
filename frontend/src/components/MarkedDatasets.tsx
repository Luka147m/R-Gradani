import { DatasetCard} from './DatasetCard.tsx';
import { useState, useEffect } from 'react';
import '../style/IzdvojeniSkupoviPodataka.css';
import { Bookmark } from 'lucide-react';
import '../style/HomePage.css'
import api from '../api/axios.tsx'
import type { DataSet } from '../types/dataset.ts';
import ApiButton from './ApiButton.tsx';



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


    const importComments = async () => {
        // const arr = JSON.parse(localStorage.getItem('savedDatasets') || '[]');
        // if (arr.length === 0) return;
        // const response = await api.post('/skupovi/ids', { ids: arr });
        // setMarkedDatasets(response.data);
    }
    return (
        <div className = "search-skupovi-div">
            <div className='ikona-naslov-div'>
                <Bookmark className='ikona' />
                <h1 className='search-skupovi-h1'>Zabilježeni skupovi podataka</h1>
            </div>
            <ApiButton apiCall={importComments} className="api-button import-button">Uvezi</ApiButton>
            <div className="skupovi-podataka-grid marked-datasets">
                {markedDatasets.map((skupPodataka) => (
                    <DatasetCard
                            key={skupPodataka.id}
                            {...skupPodataka}
                        />
                ))}
            </div>
            
        </div>
    );
};
