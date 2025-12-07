import { useMemo, useState, useEffect } from 'react';
import { Building, FolderOpen, ChartPie, Search } from 'lucide-react';
import { Slider } from '@mui/material';
import { mockInitData } from '../mockData';
import { useSearch } from '../hooks/useSearch';
import { useSearchParams } from 'react-router-dom';
import '../style/FilterContainer.css';

const marks = [
  { value: 1, label: '1' },
  { value: 2, label: '2' },
  { value: 3, label: '3' },
  { value: 4, label: '4' },
];

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
    opennessRange,
    setOpennessRange,
    acceptanceRange,
    setAcceptanceRange,
    ignoreSaved,
    setIgnoreSaved,
    ignoreReported,
    setIgnoreReported,
  } = useSearch();

  
  const [tempPublisherIds, setTempPublisherIds] = useState<string[]>(selectedPublisherIds);
  const [tempOpennessRange, setTempOpennessRange] = useState<number[]>(opennessRange);
  const [tempAcceptanceRange, setTempAcceptanceRange] = useState<number[]>(acceptanceRange);
  const [tempIgnoreSaved, setTempIgnoreSaved] = useState<boolean>(ignoreSaved);
  const [tempIgnoreReported, setTempIgnoreReported] = useState<boolean>(ignoreReported);

  useEffect(() => setTempPublisherIds(selectedPublisherIds), [selectedPublisherIds]);
  useEffect(() => setTempOpennessRange(opennessRange), [opennessRange]);
  useEffect(() => setTempAcceptanceRange(acceptanceRange), [acceptanceRange]);
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

  const handleOpennessChange = (_: Event, newValue: number | number[], activeThumb: number) => {
    if (!Array.isArray(newValue)) return;
    const MIN_DISTANCE = 1;
    setTempOpennessRange(prev => {
      if (activeThumb === 0) return [Math.min(newValue[0], prev[1] - MIN_DISTANCE), prev[1]];
      return [prev[0], Math.max(newValue[1], prev[0] + MIN_DISTANCE)];
    });
  };

  const handleAcceptanceChange = (_: Event, newValue: number | number[], activeThumb: number) => {
    if (!Array.isArray(newValue)) return;
    const MIN_DISTANCE = 0.1;
    setTempAcceptanceRange(prev => {
      if (activeThumb === 0) return [Math.min(newValue[0], prev[1] - MIN_DISTANCE), prev[1]];
      return [prev[0], Math.max(newValue[1], prev[0] + MIN_DISTANCE)];
    });
  };

  const handleApplyFilters = () => {

    setSearchTerm(localSearchTerm);
    setSelectedPublisherIds(tempPublisherIds);
    setOpennessRange(tempOpennessRange);
    setAcceptanceRange(tempAcceptanceRange);
    setIgnoreSaved(tempIgnoreSaved);
    setIgnoreReported(tempIgnoreReported);

    if (localSearchTerm.trim()) {
      setSearchParams({ q: localSearchTerm });
    } else {
      setSearchParams({});
    }
  };

  return (
    <div className="filter-container">
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
        {filteredPublisher.map(p => (
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

      <div className="title">
        <FolderOpen size={20} />
        <h2>Stupanj otvorenosti</h2>
      </div>
      <div className="slider-wrapper">
        <Slider
          value={tempOpennessRange}
          min={1}
          max={4}
          step={1}
          marks={marks}
          onChange={handleOpennessChange}
          valueLabelDisplay="auto"
          disableSwap
          sx={{
            color: 'cyan',
            '& .MuiSlider-track': { backgroundColor: 'cyan' },
            '& .MuiSlider-rail': { backgroundColor: 'white', opacity: 1 },
            '& .MuiSlider-thumb': { backgroundColor: 'cyan', border: '2px solid white' },
            '& .MuiSlider-markLabel': { color: 'white', fontSize: 12 },
            '& .MuiSlider-valueLabel': { background: 'rgba(0,180,180,0.9)' }
          }}
        />
        <div className="slider-values">
          <span>Od: {tempOpennessRange[0]}</span>
          <span>Do: {tempOpennessRange[1]}</span>
        </div>
      </div>

      <div className="title">
        <ChartPie size={20} />
        <h2>Stupanj prihvaćenosti</h2>
      </div>
      <div className="slider-wrapper">
        <Slider
          value={tempAcceptanceRange}
          min={0}
          max={1}
          step={0.01}
          onChange={handleAcceptanceChange}
          valueLabelDisplay="auto"
          disableSwap
          valueLabelFormat={(val) => `${Math.round((val as number) * 100)}%`}
          sx={{
            color: 'cyan',
            '& .MuiSlider-track': { backgroundColor: 'cyan' },
            '& .MuiSlider-rail': { backgroundColor: 'white', opacity: 1 },
            '& .MuiSlider-thumb': { backgroundColor: 'cyan', border: '2px solid white' },
            '& .MuiSlider-valueLabel': { background: 'rgba(0,180,180,0.9)' }
          }}
        />
        <div className="slider-values">
          <span>Od: {Math.round(tempAcceptanceRange[0] * 100)}%</span>
          <span>Do: {Math.round(tempAcceptanceRange[1] * 100)}%</span>
        </div>
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

      <button className="apply-filters-button" onClick={handleApplyFilters}>
        <Search size={18} />
        Pretraži
      </button>
    </div>
  );
};

export { FilterContainer };