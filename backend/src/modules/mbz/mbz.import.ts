import prisma from "../../config/prisma";
import path from 'path';
import { extractData } from "./mbz.data";
import type { Dataset, Publisher, Discussion, Resource } from "./mbz.data";
import { logToJob } from './mbz.logs';
import fs from 'fs'

async function insertIzdavac(publishers: Record<string, Publisher>, jobId: string) {
    // console.log('Inserting publishers...');
    logToJob(jobId, 'info', 'Inserting publishers...');
    const publisherArray = Object.values(publishers);

    for (const pub of publisherArray) {
        await prisma.izdavac.upsert({
            where: { id: pub.id },
            update: {
                publisher: pub.publisher,
                description: pub.description
            },
            create: {
                id: pub.id,
                publisher: pub.publisher,
                description: pub.description
            }
        });
    }

    // console.log(`Inserted ${publisherArray.length} publishers`);
    logToJob(jobId, 'info', `Inserted ${publisherArray.length} publishers`);
}

async function insertSkupPodataka(datasets: Record<string, Dataset>, jobId: string) {
    // console.log('Inserting datasets...');
    logToJob(jobId, 'info', 'Inserting datasets...');
    const datasetArray = Object.values(datasets);
    const now = new Date();

    for (let i = 0; i < datasetArray.length; i++) {
        const ds = datasetArray[i];
        await prisma.skup_podataka.upsert({
            where: { id: ds.id },
            update: {
                title: ds.title,
                refresh_frequency: ds.refresh_frequency,
                theme: ds.theme,
                description: ds.description,
                url: ds.url,
                state: ds.state,
                created: new Date(ds.created),
                modified: new Date(ds.modified),
                isopen: ds.isopen,
                access_rights: ds.access_rights,
                license_title: ds.license_title,
                license_url: ds.license_url,
                license_id: ds.license_id,
                publisher_id: ds.publisher_id,
                tags: ds.tags,
                fetched_at: now
            },
            create: {
                id: ds.id,
                title: ds.title,
                refresh_frequency: ds.refresh_frequency,
                theme: ds.theme,
                description: ds.description,
                url: ds.url,
                state: ds.state,
                created: new Date(ds.created),
                modified: new Date(ds.modified),
                isopen: ds.isopen,
                access_rights: ds.access_rights,
                license_title: ds.license_title,
                license_url: ds.license_url,
                license_id: ds.license_id,
                publisher_id: ds.publisher_id,
                tags: ds.tags,
                fetched_at: now
            }
        });

        if ((i + 1) % 10 === 0) {
            logToJob(jobId, 'debug', `Processed ${i + 1}/${datasetArray.length} datasets`);
        }
    }

    // console.log(`Inserted ${datasetArray.length} datasets`);
    logToJob(jobId, 'info', `Inserted ${datasetArray.length} datasets`);
}

async function insertResurs(resources: Resource[], jobId: string) {
    // console.log('Inserting resources...');
    logToJob(jobId, 'info', 'Inserting resources...');

    for (let i = 0; i < resources.length; i++) {
        const res = resources[i];
        await prisma.resurs.upsert({
            where: { id: res.id },
            update: {
                skup_id: res.skup_id,
                available_through_api: res.available_through_api,
                name: res.name,
                description: res.description,
                created: res.created ? new Date(res.created) : null,
                last_modified: res.last_modified ? new Date(res.last_modified) : null,
                format: res.format,
                mimetype: res.mimetype,
                state: res.state,
                size: res.size,
                url: res.url
            },
            create: {
                id: res.id,
                skup_id: res.skup_id,
                available_through_api: res.available_through_api,
                name: res.name,
                description: res.description,
                created: res.created ? new Date(res.created) : null,
                last_modified: res.last_modified ? new Date(res.last_modified) : null,
                format: res.format,
                mimetype: res.mimetype,
                state: res.state,
                size: res.size,
                url: res.url
            }
        });

        if ((i + 1) % 50 === 0) {
            logToJob(jobId, 'debug', `Processed ${i + 1}/${resources.length} resources`);
        }
    }

    // console.log(`Inserted ${resources.length} resources`);
    logToJob(jobId, 'info', `Inserted ${resources.length} resources`);
}

async function insertKomentar(discussions: Discussion[], jobId: string) {
    // console.log('Inserting comments...');
    logToJob(jobId, 'info', 'Inserting comments...');

    for (let i = 0; i < discussions.length; i++) {
        const disc = discussions[i];
        const existing = await prisma.komentar.findFirst({
            where: { import_id: disc.id ? BigInt(disc.id) : undefined },
        });

        if (existing) {
            await prisma.komentar.update({
                where: { id: existing.id },
                data: {
                    subject: disc.subject,
                    message: disc.message,
                },
            });
        } else {
            await prisma.komentar.create({
                data: {
                    import_source: 'mbz',
                    import_id: BigInt(disc.id),
                    user_id: BigInt(disc.user_id),
                    skup_id: disc.skup_id,
                    created: disc.created,
                    subject: disc.subject,
                    message: disc.message,
                },
            });
        }

        if ((i + 1) % 50 === 0) {
            logToJob(jobId, 'debug', `Processed ${i + 1}/${discussions.length} comments`);
        }

    }

    // console.log(`Inserted ${discussions.length} comments`);
    logToJob(jobId, 'info', `Inserted ${discussions.length} comments`);
}

async function importToDatabase(dir: string, jobId: string) {
    try {
        // console.log('Starting data extraction...');
        logToJob(jobId, 'info', 'Starting data extraction...');
        const result = await extractData(path.join(dir, 'activities'));

        logToJob(jobId, 'info', `Found ${Object.keys(result.all_datasets).length} datasets, ${Object.keys(result.all_publishers).length} publishers, ${result.all_discussions.length} discussions, ${result.all_resources.length} resources`);

        // console.log('\n=== Extraction Summary ===');
        // console.log('Datasets:', Object.keys(result.all_datasets).length);
        // console.log('Publishers:', Object.keys(result.all_publishers).length);
        // console.log('Discussions:', result.all_discussions.length);
        // console.log('Resources:', result.all_resources.length);
        // console.log('=========================\n');

        await insertIzdavac(result.all_publishers, jobId);

        await insertSkupPodataka(result.all_datasets, jobId);

        await insertResurs(result.all_resources, jobId);

        await insertKomentar(result.all_discussions, jobId);

        // console.log('\nDatabase import completed successfully!');
        logToJob(jobId, 'info', 'Database import completed successfully!');

    } catch (error) {
        logToJob(jobId, 'error', `Error during database import: ${error instanceof Error ? error.message : 'Unknown error'}`);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// async function testStoreData(dir: string) {
//     try {
//         console.log('Extracting data...');
//         const result = await extractData(path.join(dir, 'activities'));

//         console.log('Extracted data:');
//         console.log('- Datasets:', Object.keys(result.all_datasets).length);
//         console.log('- Publishers:', Object.keys(result.all_publishers).length);
//         console.log('- Discussions:', result.all_discussions.length);
//         console.log('- Resources:', result.all_resources.length);

//         const outputDir = path.join(process.cwd(), 'extracted_data');
//         if (!fs.existsSync(outputDir)) {
//             fs.mkdirSync(outputDir, { recursive: true });
//         }

//         const files = {
//             'datasets.json': result.all_datasets,
//             'publishers.json': result.all_publishers,
//             'discussions.json': result.all_discussions,
//             'resources.json': result.all_resources
//         };

//         for (const [filename, data] of Object.entries(files)) {
//             const filepath = path.join(outputDir, filename);
//             fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8');
//             console.log(`Saved: ${filepath}`);
//         }

//         const summary = {
//             extracted_at: new Date().toISOString(),
//             counts: {
//                 datasets: Object.keys(result.all_datasets).length,
//                 publishers: Object.keys(result.all_publishers).length,
//                 discussions: result.all_discussions.length,
//                 resources: result.all_resources.length
//             }
//         };

//         fs.writeFileSync(
//             path.join(outputDir, 'summary.json'),
//             JSON.stringify(summary, null, 2),
//             'utf-8'
//         );

//         console.log(`\n All data saved to: ${outputDir}`);

//         return result;
//     } catch (error) {
//         console.error('Error storing data:', error);
//         throw error;
//     }
// }


export { importToDatabase };