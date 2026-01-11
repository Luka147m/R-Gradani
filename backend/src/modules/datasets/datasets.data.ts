import axios from 'axios';

interface Dataset {
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

interface Publisher {
    id: string;
    publisher: string;
    description: string;
}

interface Resource {
    id: string;
    skup_id: string;
    available_through_api: boolean;
    name: string;
    description: string;
    created: string;
    last_modified: string;
    format: string;
    mimetype: string;
    state: string;
    size: number;
    url: string;
}

export async function fetchDatasetsData(identifier: string): Promise<{ dataset: Dataset | null; publisher: Publisher | null; resources: Resource[] }> {

    let dataset_data: Dataset | null = null;
    let publisher_data: Publisher | null = null;
    const all_resources: Resource[] = [];
    const apiUrl = `https://data.gov.hr/ckan/api/3/action/package_show?id=${identifier}`;
    const fullUrl = `https://data.gov.hr/ckan/dataset/${identifier}`;

    try {
        const response = await axios.get(apiUrl, { timeout: 3000 });
        const respJson = response.data;

        if (respJson.success) {
            const result = respJson.result;

            // Dataset metadata
            const datasetId = result.id;
            const title = result.title;
            const refreshFrequency = result.data_refresh_frequency;
            const theme = result.theme;
            const datasetDescription = result.notes;
            const state = result.state;

            // Timestamps
            const created = result.metadata_created;
            const modified = result.metadata_modified;

            // License
            const isOpen = Boolean(result.isopen);
            const accessRights = result.access_rights;
            const licenseTitle = result.license_title;
            const licenseUrl = result.license_url;
            const licenseId = result.license_id;

            // Publisher
            const publisherId = result.organization?.id;
            let publisher = result.organization?.title;
            const publisherDescription = result.organization?.description;

            if (!publisher) {
                publisher = result.author;
            }

            if (publisherId) {
                publisher_data = {
                    id: publisherId,
                    publisher: publisher,
                    description: publisherDescription
                };
            }

            // Tags
            const tags = result.tags || [];
            const tagsList = tags.map((tag: any) => tag.name);

            // Resources
            const resources = result.resources || [];
            for (const res of resources) {
                const resourceId = res.id;
                const availableThroughApiStr = (res.available_through_api || '').toLowerCase();
                const availableThroughApi = ['true', '1', 'yes'].includes(availableThroughApiStr);

                const resCreated = res.created;
                const resourceDesc = res.description;
                const fmt = res.format;
                const lastModified = res.last_modified;
                const mimetype = res.mimetype;
                const name = res.name;
                const resState = res.state;
                const size = parseInt(res.size || '0', 10) || 0;
                const resourceUrl = res.url;

                all_resources.push({
                    id: resourceId,
                    skup_id: datasetId,
                    available_through_api: availableThroughApi,
                    name: name,
                    description: resourceDesc,
                    created: resCreated,
                    last_modified: lastModified,
                    format: fmt,
                    mimetype: mimetype,
                    state: resState,
                    size: size,
                    url: resourceUrl
                });
            }

            // Add dataset
            dataset_data = {
                id: datasetId,
                title: title,
                refresh_frequency: refreshFrequency,
                theme: theme,
                description: datasetDescription,
                url: fullUrl,
                state: state,
                created: created,
                modified: modified,
                isopen: isOpen,
                access_rights: accessRights,
                license_title: licenseTitle,
                license_url: licenseUrl,
                license_id: licenseId,
                publisher_id: publisherId,
                tags: tagsList
            };

        } else {
            const detail = respJson && respJson.error ? JSON.stringify(respJson.error) : 'no additional details';
            throw new Error(`API returned unsuccessful response for id=${identifier}: ${detail}`);
        }

    } catch (error) {
        if (axios.isAxiosError(error)) {

            if (error.response?.status === 404) {
                return {
                    dataset: null,
                    publisher: null,
                    resources: []
                };
            }

            throw new Error(
                `Error fetching dataset ${identifier}: ${error.message}`
            );
        }

        if (error instanceof Error) {
            throw error;
        }

        throw new Error(`Unknown error fetching dataset ${identifier}`);
    }

    return {
        dataset: dataset_data,
        publisher: publisher_data,
        resources: all_resources
    };
}

