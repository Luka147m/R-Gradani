import { useMemo, useState, useEffect } from 'react';
import { Building, Calendar, Search, Settings } from 'lucide-react';
import { mockInitData } from '../mockData';
import { useSearch } from '../hooks/useSearch';
import { useSearchParams } from 'react-router-dom';
import '../style/FilterContainer.css';

interface FilterContainerProps {
  localSearchTerm: string;
}

const FilterContainer = ({ localSearchTerm }: FilterContainerProps) => {
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

  const publishers = mockInitData.result.publishers;

  const normalize = (str: string) =>
    str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const filteredPublisher = useMemo(
    () => publishers.filter(p => normalize(p.title).includes(normalize(publisherQuery))),
    [publisherQuery, publishers]
  );

  const togglePublisher = (id: string, checked: boolean) => {
    setTempPublisherIds(prev =>
      checked ? [...prev, id] : prev.filter(x => x !== id)
    );
  };

  const handleDateChange = (type: 'from' | 'to', value: string) => {
    if (type === 'from') {
      setTempDateRange([value, tempDateRange[1]]);
    } else {
      setTempDateRange([tempDateRange[0], value]);
    }
  };

  const handleApplyFilters = () => {
    setSearchParams(localSearchTerm.trim() ? { q: localSearchTerm } : {});
    setSearchTerm(localSearchTerm);
    setSelectedPublisherIds(tempPublisherIds);
    setDateRange(tempDateRange);
    setIgnoreSaved(tempIgnoreSaved);
    setIgnoreReported(tempIgnoreReported);
  };

  return (
    <div className="filter-container">
      <div className="filter-section">
        <div className="title">
          <Building size={20} />
          <h2>Izdavač</h2>
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
          {filteredPublisher.slice(0, 5).map(p => (
            <div key={p.id} className="publisher-item">
              <input
                type="checkbox"
                id={`publisher-${p.id}`}
                className="publisher-checkbox"
                checked={tempPublisherIds.includes(p.id)}
                onChange={(e) => togglePublisher(p.id, e.target.checked)}
              />
              <label htmlFor={`publisher-${p.id}`} className="publisher-label">{p.title}</label>
            </div>
          ))}
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