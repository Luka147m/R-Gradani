import { cleanText, cleanHtml } from "./mbz.clean";
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import { parseStringPromise } from 'xml2js';

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

interface Discussion {
    id: number;
    user_id: number;
    skup_id: string | null;
    created: Date;
    subject: string;
    message: string;
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

interface ExtractionResult {
    all_datasets: Record<string, Dataset>;
    all_publishers: Record<string, Publisher>;
    all_discussions: Discussion[];
    all_resources: Resource[];
}

interface ExtractionResult {
    all_datasets: Record<string, Dataset>;
    all_publishers: Record<string, Publisher>;
    all_discussions: Discussion[];
    all_resources: Resource[];
}

class MbzStructureError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'MbzStructureError';
    }
}

async function extractData(activitiesPath: string): Promise<ExtractionResult> {
    const all_datasets: Record<string, Dataset> = {};
    const all_publishers: Record<string, Publisher> = {};
    const all_discussions: Discussion[] = [];
    const all_resources: Resource[] = [];

    // Validate activities directory exists
    const activitiesDir = path.resolve(activitiesPath);
    if (!fs.existsSync(activitiesDir)) {
        throw new MbzStructureError('Activities directory not found. Invalid MBZ structure.');
    }

    if (!fs.statSync(activitiesDir).isDirectory()) {
        throw new MbzStructureError('Activities path is not a directory. Invalid MBZ structure.');
    }

    // Find forum folders
    let forumFolders: string[];
    try {
        forumFolders = fs.readdirSync(activitiesDir)
            .map(name => path.join(activitiesDir, name))
            .filter(p => fs.statSync(p).isDirectory());
    } catch (error) {
        throw new MbzStructureError('Failed to read activities directory. Invalid MBZ structure.');
    }

    if (forumFolders.length === 0) {
        throw new MbzStructureError('No forum folder found inside activities/. Invalid MBZ structure.');
    }

    const forumDir = forumFolders[0];
    const discussionFile = path.join(forumDir, 'forum.xml');

    // Validate forum.xml exists
    if (!fs.existsSync(discussionFile)) {
        throw new MbzStructureError('forum.xml not found in forum directory. Invalid MBZ structure.');
    }

    // Read and parse XML
    let xmlContent: string;
    let parsedXml: any;

    try {
        xmlContent = fs.readFileSync(discussionFile, 'utf-8');
    } catch (error) {
        throw new MbzStructureError('Failed to read forum.xml. File may be corrupted.');
    }

    try {
        parsedXml = await parseStringPromise(xmlContent);
    } catch (error) {
        throw new MbzStructureError('Failed to parse forum.xml. Invalid XML format.');
    }

    // Validate XML structure
    if (!parsedXml || typeof parsedXml !== 'object') {
        throw new MbzStructureError('Parsed XML has invalid structure.');
    }

    const root = parsedXml;
    const findAllDiscussions = (obj: any): any[] => {
        let results: any[] = [];

        if (obj.discussion) {
            results = results.concat(Array.isArray(obj.discussion) ? obj.discussion : [obj.discussion]);
        }

        for (const key in obj) {
            if (typeof obj[key] === 'object' && obj[key] !== null) {
                if (Array.isArray(obj[key])) {
                    obj[key].forEach((item: any) => {
                        if (typeof item === 'object') {
                            results = results.concat(findAllDiscussions(item));
                        }
                    });
                } else {
                    results = results.concat(findAllDiscussions(obj[key]));
                }
            }
        }

        return results;
    };

    const discussions = findAllDiscussions(root);
    console.log('[DEBUG] Found discussions:', discussions.length);

    if (discussions.length === 0) {
        console.warn('[Warning] No discussions found in forum.xml');
    }

    for (const discussion of discussions) {
        // Find all posts recursively
        const findAllPosts = (obj: any): any[] => {
            let results: any[] = [];

            if (obj.post) {
                results = results.concat(Array.isArray(obj.post) ? obj.post : [obj.post]);
            }

            for (const key in obj) {
                if (typeof obj[key] === 'object' && obj[key] !== null) {
                    if (Array.isArray(obj[key])) {
                        obj[key].forEach((item: any) => {
                            if (typeof item === 'object') {
                                results = results.concat(findAllPosts(item));
                            }
                        });
                    } else {
                        results = results.concat(findAllPosts(obj[key]));
                    }
                }
            }

            return results;
        };

        const posts = findAllPosts(discussion);

        for (const post of posts) {
            try {
                // Basic post information
                const postId = parseInt(post.$?.id || '0', 10);
                const userId = parseInt(post.userid?.[0] || '0', 10);
                const createdTimestamp = new Date(parseInt(post.created?.[0] || '0', 10) * 1000);
                const subject = cleanText(post.subject?.[0] || '');
                const message = post.message?.[0] || '';

                // Clean message (remove HTML tags)
                const messageContent = cleanHtml(message);

                const discussionEntry: Discussion = {
                    id: postId,
                    user_id: userId,
                    skup_id: null,
                    created: createdTimestamp,
                    subject: subject,
                    message: messageContent
                };

                all_discussions.push(discussionEntry);

                // Check for dataset link in original message (before cleaning)
                const urlMatch = message.match(/https:\/\/data\.gov\.hr\/ckan\/(hr\/)?dataset\/([a-zA-Z0-9\-]+)/);

                if (urlMatch) {
                    const fullUrl = urlMatch[0];
                    const identifier = urlMatch[2];

                    // Check if dataset already exists
                    if (identifier in all_datasets) {
                        const datasetId = all_datasets[identifier].id;
                        discussionEntry.skup_id = datasetId;
                        continue;
                    }

                    const apiUrl = `https://data.gov.hr/ckan/api/3/action/package_show?id=${identifier}`;

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

                            // Update discussion with skup_id
                            discussionEntry.skup_id = datasetId;

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

                            if (publisherId && !(publisherId in all_publishers)) {
                                all_publishers[publisherId] = {
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
                            all_datasets[identifier] = {
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
                            all_discussions.pop();
                            console.warn(`[Warning]: Invalid dataset response for ${identifier}, removing discussion ${postId}`);
                        }

                    } catch (error) {
                        all_discussions.pop();
                        if (axios.isAxiosError(error)) {
                            console.error(`[Error] fetching dataset ${identifier} for discussion ${postId}: ${error.message}`);
                        } else {
                            console.error(`[Error] fetching dataset ${identifier} for discussion ${postId}:`, error);
                        }
                    }
                }
            } catch (postError) {
                console.error('[Error] processing post:', postError);
                continue;
            }
        }
    }

    const filtered_discussions = all_discussions.filter(d => d.skup_id !== null);

    return {
        all_datasets,
        all_publishers,
        all_discussions: filtered_discussions,
        all_resources
    };
}

export { extractData, MbzStructureError }
export type { Dataset, Publisher, Discussion, Resource };