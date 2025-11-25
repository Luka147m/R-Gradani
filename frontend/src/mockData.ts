export interface Dataset {
  id: string;
  title: string;
  refresh_frequency: string;
  theme: string;
  description: string;
  url: string;
  state: string;
  created: string;
  modified: string;
  isopen: boolean;
  access_rights: string;
  license_title: string;
  license_url: string;
  license_id: string;
  publisher_id: string;
  tags: string[];
}

export interface Publisher {
  id: string;
  title: string;
}

export interface InitData {
  status: string;
  message: string;
  result: {
    tags: string[];
    publishers: Publisher[];
    latestDatasets: Dataset[];
  };
}

export const mockInitData: InitData = {
  status: "success",
  message: "Initial data fetched successfully.",
  result: {
    tags: [
      "zdravstvo",
      "obrazovanje",
      "promet",
      "okoliš",
      "financije"
    ],
    publishers: [
      { id: "ministarstvo-zdravstva", title: "Ministarstvo zdravstva" },
      { id: "ministarstvo-obrazovanja", title: "Ministarstvo obrazovanja" },
      { id: "grad-zagreb", title: "Grad Zagreb" },
      { id: "hzmo", title: "HZMO" },
      { id: "fina", title: "FINA" }
    ],
    latestDatasets: [
      {
        id: "550e8400-e29b-41d4-a716-446655440001",
        title: "Popis bolnica u Republici Hrvatskoj",
        refresh_frequency: "mjesečno",
        theme: "Zdravstvo",
        description: "Detaljan popis svih bolnica u RH s kontakt informacijama i brojem zaposlenih.",
        url: "https://data.gov.hr/dataset/bolnice",
        state: "active",
        created: "2024-01-15T10:30:00Z",
        modified: "2025-11-20T14:22:00Z",
        isopen: true,
        access_rights: "javno",
        license_title: "Creative Commons Attribution 4.0",
        license_url: "https://creativecommons.org/licenses/by/4.0/",
        license_id: "cc-by-4.0",
        publisher_id: "ministarstvo-zdravstva",
        tags: [ "zdravstvo", "javno" ]
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440002",
        title: "Rezultati mature 2024",
        refresh_frequency: "godišnje",
        theme: "Obrazovanje",
        description: "Statistika državne mature po županijama i predmetima za 2024. godinu.",
        url: "https://data.gov.hr/dataset/matura-2024",
        state: "active",
        created: "2024-07-10T08:15:00Z",
        modified: "2025-08-12T11:05:00Z",
        isopen: true,
        access_rights: "javno",
        license_title: "Open Data Commons Open Database License",
        license_url: "https://opendatacommons.org/licenses/odbl/",
        license_id: "odc-odbl",
        publisher_id: "ministarstvo-obrazovanja",
        tags: [ "obrazovanje", "statistika" ]
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440003",
        title: "Promet na autocestama",
        refresh_frequency: "dnevno",
        theme: "Promet",
        description: "Dnevni promet vozila na hrvatskim autocestama s podacima o naplatnim kućicama.",
        url: "https://data.gov.hr/dataset/autoceste-promet",
        state: "active",
        created: "2023-03-20T12:00:00Z",
        modified: "2025-11-25T06:30:00Z",
        isopen: true,
        access_rights: "javno",
        license_title: "Creative Commons Zero",
        license_url: "https://creativecommons.org/publicdomain/zero/1.0/",
        license_id: "cc-zero",
        publisher_id: "hac",
        tags: [ "promet", "autoceste", "realtime" ]
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440004",
        title: "Kvaliteta zraka u Zagrebu",
        refresh_frequency: "svaki sat",
        theme: "Okoliš",
        description: "Mjerenja kvalitete zraka na mjernim stanicama diljem Zagreba.",
        url: "https://data.gov.hr/dataset/zrak-zagreb",
        state: "active",
        created: "2023-11-05T09:45:00Z",
        modified: "2025-11-25T09:00:00Z",
        isopen: true,
        access_rights: "javno",
        license_title: "Creative Commons Attribution 4.0",
        license_url: "https://creativecommons.org/licenses/by/4.0/",
        license_id: "cc-by-4.0",
        publisher_id: "grad-zagreb",
        tags: [ "okoliš", "zrak", "realtime" ]
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440005",
        title: "Proračun Grada Zagreba 2025",
        refresh_frequency: "godišnje",
        theme: "Financije",
        description: "Detaljan proračun Grada Zagreba za 2025. godinu po kategorijama rashoda.",
        url: "https://data.gov.hr/dataset/proracun-zg-2025",
        state: "active",
        created: "2024-12-01T13:20:00Z",
        modified: "2025-01-10T15:40:00Z",
        isopen: true,
        access_rights: "javno",
        license_title: "Open Government Licence",
        license_url: "http://www.nationalarchives.gov.uk/doc/open-government-licence/",
        license_id: "uk-ogl",
        publisher_id: "grad-zagreb",
        tags: [ "financije", "proračun" ]
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440006",
        title: "Mirovine u Hrvatskoj",
        refresh_frequency: "mjesečno",
        theme: "Socijalna skrb",
        description: "Statistički podaci o prosječnim mirovinama po županijama i vrstama mirovina.",
        url: "https://data.gov.hr/dataset/mirovine",
        state: "active",
        created: "2024-02-14T10:10:00Z",
        modified: "2025-11-01T12:30:00Z",
        isopen: true,
        access_rights: "javno",
        license_title: "Creative Commons Attribution 4.0",
        license_url: "https://creativecommons.org/licenses/by/4.0/",
        license_id: "cc-by-4.0",
        publisher_id: "hzmo",
        tags: [ "socijalna_skrb", "mirovine" ]
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440007",
        title: "Registrirane tvrtke u RH",
        refresh_frequency: "tjedno",
        theme: "Gospodarstvo",
        description: "Popis svih registriranih pravnih osoba u Hrvatskoj s osnovnim podacima.",
        url: "https://data.gov.hr/dataset/tvrtke",
        state: "active",
        created: "2023-06-22T14:55:00Z",
        modified: "2025-11-22T08:15:00Z",
        isopen: true,
        access_rights: "javno",
        license_title: "Open Data Commons Open Database License",
        license_url: "https://opendatacommons.org/licenses/odbl/",
        license_id: "odc-odbl",
        publisher_id: "fina",
        tags: [ "gospodarstvo", "tvrtke" ]
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440008",
        title: "Javna nabava 2024",
        refresh_frequency: "dnevno",
        theme: "Javna nabava",
        description: "Svi postupci javne nabave u 2024. godini s informacijama o ponuditeljima i iznosima.",
        url: "https://data.gov.hr/dataset/javna-nabava-2024",
        state: "active",
        created: "2024-01-01T00:00:00Z",
        modified: "2025-11-24T18:45:00Z",
        isopen: true,
        access_rights: "javno",
        license_title: "Creative Commons Attribution 4.0",
        license_url: "https://creativecommons.org/licenses/by/4.0/",
        license_id: "cc-by-4.0",
        publisher_id: "ministarstvo-financija",
        tags: [ "nabava", "transparentnost" ]
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440009",
        title: "Turistički dolasci i noćenja",
        refresh_frequency: "mjesečno",
        theme: "Turizam",
        description: "Mjesečna statistika turističkih dolazaka i noćenja po vrstama smještaja i regijama.",
        url: "https://data.gov.hr/dataset/turizam-nocenja",
        state: "active",
        created: "2023-05-10T11:30:00Z",
        modified: "2025-11-10T09:20:00Z",
        isopen: true,
        access_rights: "javno",
        license_title: "Creative Commons Zero",
        license_url: "https://creativecommons.org/publicdomain/zero/1.0/",
        license_id: "cc-zero",
        publisher_id: "ministarstvo-turizma",
        tags: [ "turizam", "statistika" ]
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440010",
        title: "Cijene nekretnina",
        refresh_frequency: "kvartalno",
        theme: "Nekretnine",
        description: "Prosječne cijene stanova i kuća po gradovima i četvornim metrima.",
        url: "https://data.gov.hr/dataset/cijene-nekretnina",
        state: "active",
        created: "2024-03-15T16:00:00Z",
        modified: "2025-10-01T14:10:00Z",
        isopen: true,
        access_rights: "javno",
        license_title: "Open Data Commons Open Database License",
        license_url: "https://opendatacommons.org/licenses/odbl/",
        license_id: "odc-odbl",
        publisher_id: "dzs",
        tags: [ "nekretnine", "tržište" ]
      }
    ]
  }
};