import { useState, useMemo} from 'react';
import { Building, FolderOpen, ChartPie } from 'lucide-react';
import { Slider } from '@mui/material';
import { mockInitData } from '../mockData';
import '../FilterContainer.css';

interface FilterContainerProps {
    onPublisherFilterChange?: (ids: string[]) => void;
    onIgnoreSavedChange?: (ignore: boolean) => void;
}

const marks = [
  { value: 1, label: '1' },
  { value: 2, label: '2' },
  { value: 3, label: '3' },
  { value: 4, label: '4' },
];

const FilterContainer: React.FC<FilterContainerProps> = ({ onPublisherFilterChange, onIgnoreSavedChange }) => {
  const publishers = mockInitData.result.publishers;

  const [openness, setOpenness] = useState<number[]>([1, 4]);
  const [acceptance, setAcceptance] = useState<number[]>([0, 1]);
  const [publisherQuery, setPublisherQuery] = useState<string>('');

  const [selectedPublisherIds, setSelectedPublisherIds] = useState<string[]>([]);
  const [ignoreSaved, setIgnoreSaved] = useState(false);


  const normalize = (str: string) => {
    return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  };

  const filteredPublisher = useMemo(
    () => {
      return publishers.filter(p => 
        normalize(p.title).includes(normalize(publisherQuery))
      );
    },
    [publisherQuery, publishers]
  )

  const togglePublisher = (id: string, checked: boolean) => {
    const next = checked
      ? [...selectedPublisherIds, id]
      : selectedPublisherIds.filter(x => x !== id);
    setSelectedPublisherIds(next);
    onPublisherFilterChange?.(next);
  };

  const handleIgnoreSavedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.checked;
    setIgnoreSaved(val);
    onIgnoreSavedChange?.(val);
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
                checked={selectedPublisherIds.includes(p.id)}
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
          value={openness}
          getAriaLabel={() => 'Minimum distance'}
          min={1}
          max={4}
          step={1}
          marks={marks}
          onChange={(_, v) => setOpenness(v as number[])}
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
          <span>Od: {openness[0]}</span>
          <span>Do: {openness[1]}</span>
        </div>
      </div>

      <div className="title">
        <ChartPie size={20} />
        <h2>Stupanj prihvaćenosti</h2>
      </div>
      <div className="slider-wrapper">
        <Slider
          value={acceptance}
          min={0}
          max={1}
          step={0.01}
            marks={marks}
          onChange={(_, v) => setAcceptance(v as number[])}
          valueLabelDisplay="auto"
          disableSwap
          valueLabelFormat={(val) => `${Math.round((val as number) * 100)}%`}
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
          <span>Od: {Math.round(acceptance[0] * 100)}%</span>
          <span>Do: {Math.round(acceptance[1] * 100)}%</span>
        </div>
      </div>

      <div className="ignore-checkboxes">
        <div className="publisher-item">
          <input
            type="checkbox"
            id="ignore-saved-datasets-checkbox"
            className="publisher-checkbox"
            checked={ignoreSaved}
            onChange={handleIgnoreSavedChange}
          />
          <label htmlFor="ignore-saved-datasets-checkbox" className="publisher-label">
            Ignoriraj spremljene skupove podataka
          </label>
        </div>
        <div className="publisher-item">
          <input type="checkbox" id="ignore-reported-datasets-checkbox" className="publisher-checkbox" />
          <label htmlFor="ignore-reported-datasets-checkbox" className="publisher-label">
            Ignoriraj skupove podataka koji imaju prijavljene probleme
          </label>
        </div>
      </div>
    </div>
  );
};

export { FilterContainer };