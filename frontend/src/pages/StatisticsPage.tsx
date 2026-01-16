import '../style/StatisticsPage.css';
import { useEffect, useState } from 'react';
import api from '../api/axios.tsx';
import type { StatsResponseDto } from '../DTOs/statsDTO';
import CommentPieChart from '../components/statsComponents/CommentPieChart';
import TopIzdavaciDatasetsList from "../components/statsComponents/TopIzdavaciDatasetsList";
import TopSkupoviLists from "../components/statsComponents/TopSkupoviLists";
import ResponsesPieChart from '../components/statsComponents/ResponsesPieChart';
import ScoreHistogram from '../components/statsComponents/ScoreHistogram.tsx';
import EntryPieChart from '../components/statsComponents/EntryPieChart.tsx';
import CategoryReport from '../components/statsComponents/CategoryReport.tsx';


function StatisticsPage() {
  const [stats, setStats] = useState<StatsResponseDto | null>(null);

  useEffect(() => {
    api.get<StatsResponseDto>('/stats').then((response) => {
      setStats(response.data);
    });
  }, []);

  if (!stats) {
    return <p>Loading stats...</p>;
  }

  return (
    <div className="main-container statistics-page-container">
      <div>
        <h1>Statistika aplikacije R-Građani</h1>
        <p>Ovdje možete pronaći različite statistike vezane uz komentare, analize, izdavače i skupove podataka.</p>
      </div>
 
      <div className='pie-charts-container'>
        
        {/* Komentari */}
        {stats.komentar.total > 0 ? (
          <CommentPieChart
            total={stats.komentar.total} 
            obradenih={stats.komentar.obradenih} 
          />
        ) : (
          <p>Nema podataka o komentarima!</p>
        )}

        {/* Analiza dio */}
        {stats.odgovori.count > 0 ? (
          <ResponsesPieChart 
            count={stats.odgovori.count} 
            failed={stats.odgovori.failed} 
          />
        ) : (
          <p>Nema analiza u sustavu!</p>
        )}

        {stats.odgovori.izjave.total > 0 ? (
          <EntryPieChart 
            total={stats.odgovori.izjave.total} 
            usvojeno={stats.odgovori.izjave.usvojeni} 
          />
        ) : (
          <p>Nema izjava u sustavu!</p>
        )}
      </div>
      
      <div className='score-stats-section'>
        <h2>Statistika ocjena analize</h2>

        <p>Ocjena analize se nalazi unutar raspona 0-100, gdje 0 označuje da komentar nije istinit (odnosno dogodile su se promjene u skupu podataka) 
         te se za takve komentare smatra da su oni uvaženi, 
         dok na drugoj strani ocjena od 100 označuje istinit komentar i da se ništa nije promijenilo u skupu podataka.
        </p>

      <h3>
        Prosjek (avg):{" "}
        <span className="stat-number">
          {stats.odgovori.scoreStats.avg.toFixed(2)}
        </span>
      </h3>
        
      <h3>
        Medijan (median):{" "}
        <span className="stat-number">
          {stats.odgovori.scoreStats.median.toFixed(2)}
        </span>
      </h3>

      {stats.odgovori.scoreHistogram.length > 0 ? (
        <ScoreHistogram data={stats.odgovori.scoreHistogram} />
      ) : (
        <p>Nema podataka za histogram!</p>
      )}
      </div>

      {/* Izjave */}
      <div className='entry-section'>

      <h2>Kategorije problema</h2>
      <p>Tijekom analize umjetnoj inteligenciji je predano nekoliko kategorija problema te joj je zadan zadatak da svaku izjavu sortira u neku od kategorija.
        Sljedeći graf je rezultat te kategorizacije i prikazuje koliko je koja grupa problema usvojena/neusvojena odnosno to možemo 
        interpretirati kao koliko je koja kategorija popravljena ili nije popravljenja.
      </p><br/>
      {stats.odgovori.categoryReport.length > 0 ? (
        <CategoryReport categoryReport={stats.odgovori.categoryReport} maxItems={10} />
      ) : (
        <div><p>Nema izjava u sustavu!</p><br/></div>
      )}

      <p>*Podudarnost predstavlja postotak zapisa/redaka za koji je izjava istinita.
         Ako je podudarnost manja od 25, onda je usvojenost True inače False.</p>

      </div>

      <div className='general-info'>
        <h2 className='general-info-title'>Generalne informacije o skupovima podataka/izdavačima</h2>
        {/* Skupovi podataka */}
        <h3>Skupovi podataka</h3>
        {stats.skupovi_podataka.topSkupPodataka.length > 0 ? (
          <TopSkupoviLists skupovi_podataka={stats.skupovi_podataka} maxItems={10} />
        ) : (
          <p>Nema podataka o skupovima podataka!</p>
        )}

        {/* Izdavaci */}
        <h3>Top izdavači po broju skupova podataka</h3>
        {stats.izdavaci.length > 0 ? (
          <TopIzdavaciDatasetsList izdavaci={stats.izdavaci} maxItems={20} />
        ) : (
          <p>Nema podataka o izdavačima!</p>
        )}
      </div>


    </div>
  );
}
export default StatisticsPage;
