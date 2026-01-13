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
    const [importIsSelected, setImportIsSelected] = useState<boolean>(false);
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState<boolean>(false);

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
        setImportIsSelected(true);
    }

    const submitImport = () => {
        const uploadFile = async () => {

            //file mora biti formata .mbz
            if(file == null) alert("Nije odabran niti jedan file.");
    
            if (file && file.name.endsWith('.mbz')) {
                // Handle file upload
                console.log('Valid .mbz file');
            } else {
                alert("Datoteka mora biti u .mbz formatu.");
                setFile(null);
                return;
            }
    
            setIsUploading(true);
            await api.post('/upload', file, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            })
            setIsUploading(false);
    
    
    
            setImportIsSelected(false);
        }
        return uploadFile();
    }

    return (
        <>
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
            {importIsSelected && (
                <div className="overlay">
                    <div className="import-modal">
                        <h2>Uvoz zabilježenih skupova podataka</h2>
                        <p>Funkcionalnost uvoza će uskoro biti dostupna.</p>
                        <button className="import-modal-close-button" onClick={() => setImportIsSelected(false)}>x</button>
                        <input type="file" onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} />
                        <ApiButton apiCall={submitImport} className="api-button">
                            {isUploading ? 'Učitavanje...' : 'Potvrdi'}
                        </ApiButton>
                    </div>
                </div>
            )}
        </>
    );
};
