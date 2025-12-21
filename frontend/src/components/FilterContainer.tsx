import { useMemo, useState, useEffect } from 'react';
import { Building, Calendar, Search, Settings } from 'lucide-react';
import { useSearch } from '../hooks/useSearch';
import { useSearchParams } from 'react-router-dom';
import '../style/FilterContainer.css';
import { Publisher } from '../types/publisher';
import api from '../api/axios.tsx'
import type { DataSet } from '../types/dataset';


type FilterContainerProps = {
  localSearchTerm: string;
  setAllResults: React.Dispatch<React.SetStateAction<DataSet[]>>;
};

const FilterContainer = ({ localSearchTerm, setAllResults }: FilterContainerProps) => {
  const [, setSearchParams] = useSearchParams();
  const {
    setSearchTerm,
    selectedPublisherIds,
    setSelectedPublisherIds,
    publisherQuery,
    setPublisherQuery,
    dateRange,
    setDateRange,
    ignoreSaved,
    setIgnoreSaved,
    ignoreReported,
    setIgnoreReported,
  } = useSearch();

  const [tempPublisherIds, setTempPublisherIds] = useState<string[]>(selectedPublisherIds);
  const [tempDateRange, setTempDateRange] = useState<[string, string]>(dateRange);
  const [tempIgnoreSaved, setTempIgnoreSaved] = useState<boolean>(ignoreSaved);
  const [tempIgnoreReported, setTempIgnoreReported] = useState<boolean>(ignoreReported);

  useEffect(() => setTempPublisherIds(selectedPublisherIds), [selectedPublisherIds]);
  useEffect(() => setTempDateRange(dateRange), [dateRange]);
  useEffect(() => setTempIgnoreSaved(ignoreSaved), [ignoreSaved]);
  useEffect(() => setTempIgnoreReported(ignoreReported), [ignoreReported]);

  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [showAllPublishers, setShowAllPublishers] = useState(false);


  useEffect(() => {
      api.get('/izdavaci').then((response) => {
          setPublishers(response.data);        
      });
  }, []);

  
  
  const normalize = (str: string) =>
    str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  const filteredPublisher = useMemo(
    () => publishers.filter(p => normalize(p.publisher ?? '').includes(normalize(publisherQuery))),
    [publisherQuery, publishers]
  );
  
  const visiblePublishers = showAllPublishers
    ? filteredPublisher
    : filteredPublisher.slice(0, 5);

  const visiblePublisherIds = visiblePublishers.map(p => p.id);

  const areAllVisibleChecked = visiblePublisherIds.every(id =>
    tempPublisherIds.includes(id)
  );

  const toggleVisiblePublishers = () => {
    setTempPublisherIds(prev => {
      if (areAllVisibleChecked) {
        return prev.filter(id => !visiblePublisherIds.includes(id));
      } else {
        return Array.from(new Set([...prev, ...visiblePublisherIds]));
      }
    });
  };

  const togglePublisher = (id: string, checked: boolean) => {
    setTempPublisherIds(prev =>
      checked ? [...prev, id] : prev.filter(x => x !== id)
    );
  };

  useEffect(() => {
    const allIds = filteredPublisher.map(p => p.id);
    setTempPublisherIds(allIds);
  }, [filteredPublisher]);

  const handleDateChange = (type: 'from' | 'to', value: string) => {
    if (type === 'from') {
      setTempDateRange([value, tempDateRange[1]]);
    } else {
      setTempDateRange([tempDateRange[0], value]);
    }
  };

  const handleApplyFilters = async () => {
    setSearchParams(localSearchTerm.trim() ? { q: localSearchTerm } : {});
    setSearchTerm(localSearchTerm);
    setSelectedPublisherIds(tempPublisherIds);
    setDateRange(tempDateRange);
    setIgnoreSaved(tempIgnoreSaved);
    setIgnoreReported(tempIgnoreReported);
    
    const visiblePublishers = showAllPublishers
      ? filteredPublisher
      : filteredPublisher.slice(0, 5);

    const checkedVisiblePublisherIds = visiblePublishers
      .filter(p => tempPublisherIds.includes(p.id))
      .map(p => p.id);
    
    const response = await api.post('/skupovi/filter', { publisherIds: checkedVisiblePublisherIds });
    setAllResults(response.data);    
  };

  return (
    <div className="filter-container">
      <div className="filter-section">
        <div className="title">
          <Building size={20} />
          <h2>Izdavač</h2>
          <button
            type="button"
            className="select-all-btn"
            onClick={toggleVisiblePublishers}
          >
            {areAllVisibleChecked ? 'Isključi sve' : 'Označi sve'}
          </button>
        </div>
        <div className="search-publisher">
          <input
            type="text"
            placeholder="Pretraži izdavače"
            className="publisher-input"
            value={publisherQuery}
            onChange={(e) => setPublisherQuery(e.target.value)}
          />
        </div>
        <div className="publisher-list">
          {visiblePublishers.map(p => (
            <div key={p.id} className="publisher-item">
              <input
                type="checkbox"
                id={`publisher-${p.id}`}
                checked={tempPublisherIds.includes(p.id)}
                onChange={e => togglePublisher(p.id, e.target.checked)}
              />
              <label htmlFor={`publisher-${p.id}`}>
                {p.publisher}
              </label>
            </div>
          ))}

          {filteredPublisher.length > 5 && (
            <button
              type="button"
              className="show-more-less-btn"
              onClick={() => setShowAllPublishers(prev => !prev)}
            >
              {showAllPublishers ? 'Prikaži manje' : 'Prikaži više'}
            </button>
          )}

          {filteredPublisher.length === 0 && (
            <div className="publisher-item"><em>Nema rezultata</em></div>
          )}
        </div>
      </div>

      <div className="filter-section">
        <div className="title">
          <Calendar size={20} />
          <h2>Datum objave</h2>
        </div>
        <div className="date-range-wrapper">
          <label htmlFor="date-from">Od</label>
          <input
            type="date"
            id="date-from"
            className="date-input"
            value={tempDateRange[0]}
            onChange={(e) => handleDateChange('from', e.target.value)}
          />
          <label htmlFor="date-to">do</label>
          <input
            type="date"
            id="date-to"
            className="date-input"
            value={tempDateRange[1]}
            onChange={(e) => handleDateChange('to', e.target.value)}
          />
        </div>
      </div>

      <div className="filter-section">
        <div className="title">
          <Settings size={20} />
          <h2>Ostalo</h2>
        </div>
        <div className="ignore-checkboxes">
          <div className="publisher-item">
            <input
              type="checkbox"
              id="ignore-saved-datasets-checkbox"
              className="publisher-checkbox"
              checked={tempIgnoreSaved}
              onChange={(e) => setTempIgnoreSaved(e.target.checked)}
            />
            <label htmlFor="ignore-saved-datasets-checkbox" className="publisher-label">
              Ignoriraj spremljene skupove podataka
            </label>
          </div>
          <div className="publisher-item">
            <input
              type="checkbox"
              id="ignore-reported-datasets-checkbox"
              className="publisher-checkbox"
              checked={tempIgnoreReported}
              onChange={(e) => setTempIgnoreReported(e.target.checked)}
            />
            <label htmlFor="ignore-reported-datasets-checkbox" className="publisher-label">
              Ignoriraj skupove podataka koji imaju prijavljene probleme
            </label>
          </div>
        </div>
      </div>

      <div className="filter-section">
        <button className="apply-filters-button" onClick={handleApplyFilters}>
          <Search size={18} />
          Pretraži
        </button>
      </div>
    </div>
  );
};

export { FilterContainer };