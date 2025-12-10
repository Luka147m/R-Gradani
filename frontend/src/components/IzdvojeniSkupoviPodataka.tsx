import { SkupPodatakaCard} from './SkupPodatakaCard';
import '../style/IzdvojeniSkupoviPodataka.css';
import { BadgeAlert } from 'lucide-react';
import '../style/HomePage.css'
import { useState, useEffect } from 'react';

//import { mockInitData }  from '../mockData.ts';
import {DataSet} from '../types/dataset.ts'
import api from '../api/axios.tsx'

export const IzdvojeniSkupoviPodataka = () => {
    const [datasets, setDatasets] = useState<DataSet[]>([]);

    useEffect(() => {
        api.get('/skupovi/nedavno').then((response) => {
            setDatasets(response.data);
        });
    }, []);

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
                        {...skupPodataka}
                    />
                ))}
            </div>
            
        </div>
    );
};
