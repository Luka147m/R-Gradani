import { useEffect, useState } from "react";
import { SkupPodatakaCard } from "./SkupPodatakaCard";
import { mockInitData, type Dataset } from "../mockData";
import { ArrowDownUp } from 'lucide-react';
import { useSearch } from '../hooks/useSearch';
import '../style/SearchPage.css';

type SortOption = 'title-asc' | 'title-desc' | 'date-desc' | 'date-asc';

const SearchResults = () => {
    const {
        searchTerm,
        selectedPublisherIds,
        ignoreSaved,
        ignoreReported,
        dateRange,
    } = useSearch();
    
    const [results, setResults] = useState<Dataset[]>([]);
    const [sortOption, setSortOption] = useState<SortOption>('date-desc');

    useEffect(() => {
        const savedIds: string[] = JSON.parse(localStorage.getItem('savedDatasets') || '[]');
        const reportedIds: string[] = JSON.parse(localStorage.getItem('reportedDatasets') || '[]');

        let filtered = mockInitData.result.latestDatasets.filter(d =>
            d.title.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (selectedPublisherIds.length > 0) {
            filtered = filtered.filter(d => selectedPublisherIds.includes(d.publisher_id));
        }

        if (ignoreSaved) {
            filtered = filtered.filter(d => !savedIds.includes(d.id));
        }

        if (ignoreReported) {
            filtered = filtered.filter(d => !reportedIds.includes(d.id));
        }

        
        if (dateRange[0]) {
            filtered = filtered.filter(d => new Date(d.created) >= new Date(dateRange[0]));
        }
        if (dateRange[1]) {
            
            const endDate = new Date(dateRange[1]);
            endDate.setDate(endDate.getDate() + 1);
            filtered = filtered.filter(d => new Date(d.created) < endDate);
        }

        const sorted = sortResults(filtered, sortOption);
        setResults(sorted);
    }, [searchTerm, selectedPublisherIds, sortOption, ignoreSaved, ignoreReported, dateRange]);

    const sortResults = (data: Dataset[], option: SortOption): Dataset[] => {
        const sorted = [...data];
        switch(option) {
            case 'title-asc': return sorted.sort((a, b) => a.title.localeCompare(b.title));
            case 'title-desc': return sorted.sort((a, b) => b.title.localeCompare(a.title));
            case 'date-desc': return sorted.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
            case 'date-asc': return sorted.sort((a, b) => new Date(a.created).getTime() - new Date(b.created).getTime());
            default: return sorted;
        }
    };

    return (
        <div className="search-results">
            <div className="title-and-sort">
                <h2>{results.length} {results.length === 1 ? 'rezultat' : 'rezultata'} pretrage</h2>
                <div className="sort-options">
                    <label htmlFor="sort-select"><ArrowDownUp /></label>
                    <select 
                        id="sort-select" 
                        value={sortOption}
                        onChange={(e) => setSortOption(e.target.value as SortOption)}
                    >
                        <option value="title-asc">Naslovu (A-Z)</option>
                        <option value="title-desc">Naslovu (Z-A)</option>
                        <option value="date-desc">Datumu (najnovije)</option>
                        <option value="date-asc">Datumu (najstarije)</option>
                    </select>
                </div>
            </div>
            <div className='search-result-grid'>
                {results.length > 0 ? (
                    results.slice(0, 10).map(dataset => (
                        <SkupPodatakaCard
                            key={dataset.id}
                            id={dataset.id}
                            title={dataset.title}
                            url={dataset.url}
                            fetched_at={dataset.modified ? new Date(dataset.modified) : new Date()}
                        />
                    ))
                ) : (
                    <p>Nema rezultata za prikaz.</p>
                )}
            </div>
        </div>
    );
};

export { SearchResults };