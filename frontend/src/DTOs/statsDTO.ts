export interface StatsResponseDto {
    komentar: KomentarStats;
    izdavaci: PublisherCount[];
    skupovi_podataka: SkupPodatakaStats;
    odgovori: OdgovorStats;
}

export interface KomentarStats {
    total: number;
    obradenih: number;
}

export interface PublisherCount {
    publisher: string;
    count: number;
}

export interface SkupPodatakaStats {
    total: number;
    topTags: TagCount[];
    topTheme: ThemeCount[];
    topSkupPodataka: TopSkupPodataka[];
}

export interface TagCount {
    tag: string;
    count: number;
}

export interface ThemeCount {
    theme: string;
    count: number;
}

export interface TopSkupPodataka {
    id: string;       // UUID
    title: string;
    count: number;
}

export interface OdgovorStats {
    count: number;
    failed: number;
    scoreHistogram: ScoreHistogramItem[];
    scoreStats: ScoreStats;
    izjave: IzjaveStats;
    categoryReport: CategoryReportItem[];
}

export interface ScoreHistogramItem {
    score: number;
    count: number;
}

export interface ScoreStats {
    avg: number;
    median: number;
}

export interface IzjaveStats {
    total: number;
    usvojeni: number;
}

export interface CategoryReportItem {
    category: string;
    count: number;
    usvojeni: number;
}
