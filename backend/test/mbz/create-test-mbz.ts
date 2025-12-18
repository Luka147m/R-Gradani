import fs from 'fs';
import path from 'path';
import archiver from 'archiver';

/**
 * Creates a valid MBZ test file
 */
async function createValidMbz(outputPath: string): Promise<void> {
    const tempDir = path.join(process.cwd(), 'temp-mbz-valid');

    // Create directory structure
    const activitiesDir = path.join(tempDir, 'activities');
    const forumDir = path.join(activitiesDir, 'forum_12345');

    fs.mkdirSync(forumDir, { recursive: true });

    // Create valid forum.xml
    const forumXml = `<?xml version="1.0" encoding="UTF-8"?>
<activity id="12345" moduleid="67890" modulename="forum" contextid="11111">
  <forum id="12345">
    <discussions>
      <discussion id="1">
        <posts>
          <post id="101">
            <userid>1</userid>
            <created>1700000000</created>
            <subject>Test Dataset Discussion</subject>
            <message><![CDATA[Check out this dataset: https://data.gov.hr/ckan/dataset/popis-stanovnistva-2021]]></message>
          </post>
          <post id="102">
            <userid>2</userid>
            <created>1700000100</created>
            <subject>Another Dataset</subject>
            <message><![CDATA[Look at https://data.gov.hr/ckan/dataset/proracun-2023]]></message>
          </post>
        </posts>
      </discussion>
    </discussions>
  </forum>
</activity>`;

    fs.writeFileSync(path.join(forumDir, 'forum.xml'), forumXml);

    // Create moodle_backup.xml (optional but realistic)
    const backupXml = `<?xml version="1.0" encoding="UTF-8"?>
<moodle_backup>
  <information>
    <name>Test Backup</name>
    <moodle_version>4.1</moodle_version>
    <backup_date>1700000000</backup_date>
  </information>
</moodle_backup>`;

    fs.writeFileSync(path.join(tempDir, 'moodle_backup.xml'), backupXml);

    // Create MBZ archive
    await createZipArchive(tempDir, outputPath);

    // Cleanup
    fs.rmSync(tempDir, { recursive: true, force: true });

    console.log(`Valid MBZ created: ${outputPath}`);
}

/**
 * Creates invalid MBZ test files for different error scenarios
 */
async function createInvalidMbz(scenario: string, outputPath: string): Promise<void> {
    const tempDir = path.join(process.cwd(), `temp-mbz-invalid-${scenario}`);

    switch (scenario) {
        case 'no-activities':
            // Missing activities directory
            fs.mkdirSync(tempDir, { recursive: true });
            fs.writeFileSync(path.join(tempDir, 'readme.txt'), 'No activities folder');
            break;

        case 'empty-activities':
            // Empty activities directory
            fs.mkdirSync(path.join(tempDir, 'activities'), { recursive: true });
            break;

        case 'no-forum-xml':
            // Has forum folder but no forum.xml
            const forumDir1 = path.join(tempDir, 'activities', 'forum_12345');
            fs.mkdirSync(forumDir1, { recursive: true });
            fs.writeFileSync(path.join(forumDir1, 'other.txt'), 'Missing forum.xml');
            break;

        case 'invalid-xml':
            // Corrupted XML
            const forumDir2 = path.join(tempDir, 'activities', 'forum_12345');
            fs.mkdirSync(forumDir2, { recursive: true });
            fs.writeFileSync(
                path.join(forumDir2, 'forum.xml'),
                '<?xml version="1.0"?><broken><unclosed>'
            );
            break;

        case 'empty-xml':
            // Empty XML file
            const forumDir3 = path.join(tempDir, 'activities', 'forum_12345');
            fs.mkdirSync(forumDir3, { recursive: true });
            fs.writeFileSync(path.join(forumDir3, 'forum.xml'), '');
            break;

        case 'no-discussions':
            // Valid XML but no discussions
            const forumDir4 = path.join(tempDir, 'activities', 'forum_12345');
            fs.mkdirSync(forumDir4, { recursive: true });
            const emptyForumXml = `<?xml version="1.0" encoding="UTF-8"?>
<activity id="12345" moduleid="67890" modulename="forum" contextid="11111">
  <forum id="12345">
    <discussions>
    </discussions>
  </forum>
</activity>`;
            fs.writeFileSync(path.join(forumDir4, 'forum.xml'), emptyForumXml);
            break;

        case 'malformed-posts':
            // Posts with missing required fields
            const forumDir5 = path.join(tempDir, 'activities', 'forum_12345');
            fs.mkdirSync(forumDir5, { recursive: true });
            const malformedXml = `<?xml version="1.0" encoding="UTF-8"?>
<activity id="12345">
  <forum id="12345">
    <discussions>
      <discussion id="1">
        <posts>
          <post id="201">
            <!-- Missing userid, created, subject, message -->
          </post>
        </posts>
      </discussion>
    </discussions>
  </forum>
</activity>`;
            fs.writeFileSync(path.join(forumDir5, 'forum.xml'), malformedXml);
            break;

        default:
            throw new Error(`Unknown scenario: ${scenario}`);
    }

    await createZipArchive(tempDir, outputPath);

    // Cleanup
    fs.rmSync(tempDir, { recursive: true, force: true });

    console.log(`Invalid MBZ (${scenario}) created: ${outputPath}`);
}

/**
 * Helper function to create ZIP archive
 */
function createZipArchive(sourceDir: string, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const output = fs.createWriteStream(outputPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', () => resolve());
        archive.on('error', (err) => reject(err));

        archive.pipe(output);
        archive.directory(sourceDir, false);
        archive.finalize();
    });
}

/**
 * Generate all test files
 */
async function generateAllTestFiles(): Promise<void> {
    const testDir = path.join(process.cwd(), 'test-mbz-files');
    fs.mkdirSync(testDir, { recursive: true });

    // Create valid MBZ
    await createValidMbz(path.join(testDir, 'valid.mbz'));

    // Create invalid MBZ files
    const scenarios = [
        'no-activities',
        'empty-activities',
        'no-forum-xml',
        'invalid-xml',
        'empty-xml',
        'no-discussions',
        'malformed-posts'
    ];

    for (const scenario of scenarios) {
        await createInvalidMbz(scenario, path.join(testDir, `invalid-${scenario}.mbz`));
    }

    console.log(`\nAll test files created in: ${testDir}`);
    console.log('\nTest files generated:');
    console.log('- valid.mbz (should work)');
    scenarios.forEach(s => console.log(`- invalid-${s}.mbz (should fail with specific error)`));
}

// Run if executed directly
if (require.main === module) {
    generateAllTestFiles().catch(console.error);
}

export { createValidMbz, createInvalidMbz, generateAllTestFiles };