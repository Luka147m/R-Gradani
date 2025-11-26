import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, Home, LayoutDashboard } from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { PublisherCard } from '../components/Publishercard';
import { mockInitData } from '../mockData';
import '../HomePage.css';

interface Publisher {
    id: string;
    title: string;
}

function PublisherSearchPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [selected, setSelected] = useState<"home" | "profile">("home");
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredPublishers, setFilteredPublishers] = useState<Publisher[]>([]);

    const normalize = (s: string) =>
        s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    useEffect(() => {
        const query = searchParams.get('q') || '';
        setSearchTerm(query);
        
        const filtered = mockInitData.result.publishers.filter(publisher =>
            normalize(publisher.title).includes(normalize(query))
        );
        setFilteredPublishers(filtered);
    }, [searchParams]);

    const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const input = (event.currentTarget.querySelector('.search-input') as HTMLInputElement);
        const newSearchTerm = input.value;
        
        if(newSearchTerm.trim() === '') return;
        
        setSearchParams({ q: newSearchTerm });
    };

    const getDatasetCount = (publisherId: string): number => {
        return mockInitData.result.latestDatasets.filter(
            dataset => dataset.publisher_id === publisherId
        ).length;
    };

    return (
        <>
            <div className="home-profile-selector">
                <Link to="/">
                    <button
                        className={`selector-btn ${selected === "home" ? "active-home" : ""}`}
                        onClick={() => setSelected("home")}
                    >
                        <Home size={24} />
                    </button>
                </Link>
                <Link to="/profile">
                    <button
                        className={`selector-btn profile-btn ${selected === "profile" ? "active-profile" : ""}`}
                        onClick={() => setSelected("profile")}
                    >
                        <LayoutDashboard size={24} />
                    </button>
                </Link>
            </div>

            <div className="main-container">
                <div className='search-skupovi-div'>
                    <div className='ikona-naslov-div'>
                        <Search className="ikona"/>
                        <h1 className='search-skupovi-h1'>Pretražite izdavače</h1>
                    </div>
                    <form className="search" onSubmit={handleSearch}>
                        <input 
                            type="text" 
                            placeholder="Unesite naziv izdavača" 
                            className="search-input search-container"
                            defaultValue={searchTerm}
                        />
                        <button className="search-button" type="submit">
                            <FontAwesomeIcon icon={faMagnifyingGlass} />
                        </button>
                    </form>
                </div>

                <div className="search-skupovi-div">
                    <h2 style={{ color: 'white', marginBottom: '20px' }}>
                        {filteredPublishers.length} {filteredPublishers.length === 1 ? 'rezultat' : 'rezultata'} pretrage
                    </h2>
                    <div className="recent-publishers-div">
                        {filteredPublishers.length > 0 ? (
                            filteredPublishers.map((publisher) => (
                                <PublisherCard
                                    key={publisher.id}
                                    id={publisher.id}
                                    name={publisher.title}
                                    numOfDatasets={getDatasetCount(publisher.id)}
                                />
                            ))
                        ) : (
                            <p style={{ color: 'white' }}>Nema rezultata za "{searchTerm}"</p>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

export default PublisherSearchPage;