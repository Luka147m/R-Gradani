import { generateAllTestFiles } from './create-test-mbz';
import { extractData, MbzStructureError } from '../../src/modules/mbz/mbz.data';;
import path from 'path';
import fs from 'fs';
import AdmZip from 'adm-zip';

interface TestResult {
    file: string;
    passed: boolean;
    error?: string;
    expectedError?: string;
}

/**
 * Extract MBZ file to temporary directory
 */
function extractMbz(mbzPath: string, extractPath: string): void {
    const zip = new AdmZip(mbzPath);
    zip.extractAllTo(extractPath, true);
}

/**
 * Run a single test
 */
async function runTest(
    testName: string,
    mbzPath: string,
    shouldFail: boolean,
    expectedErrorPattern?: string
): Promise<TestResult> {
    const extractPath = path.join(process.cwd(), 'temp-extract', testName);

    try {
        // Extract MBZ
        fs.mkdirSync(extractPath, { recursive: true });
        extractMbz(mbzPath, extractPath);

        // Try to extract data
        const result = await extractData(path.join(extractPath, 'activities'));

        // Cleanup
        fs.rmSync(extractPath, { recursive: true, force: true });

        if (shouldFail) {
            return {
                file: testName,
                passed: false,
                error: 'Expected to fail but succeeded'
            };
        }

        console.log(`${testName}: Passed`);
        console.log(`   Datasets: ${Object.keys(result.all_datasets).length}`);
        console.log(`   Publishers: ${Object.keys(result.all_publishers).length}`);
        console.log(`   Discussions: ${result.all_discussions.length}`);
        console.log(`   Resources: ${result.all_resources.length}`);

        return {
            file: testName,
            passed: true
        };

    } catch (error) {
        // Cleanup
        if (fs.existsSync(extractPath)) {
            fs.rmSync(extractPath, { recursive: true, force: true });
        }

        const errorMessage = error instanceof Error ? error.message : String(error);

        if (shouldFail) {
            // Check if error matches expected pattern
            const matchesExpected = expectedErrorPattern
                ? errorMessage.includes(expectedErrorPattern)
                : true;

            if (matchesExpected) {
                console.log(`${testName}: Passed (failed as expected)`);
                console.log(`   Error: ${errorMessage}`);
                return {
                    file: testName,
                    passed: true,
                    expectedError: errorMessage
                };
            } else {
                console.log(`${testName}: Failed (wrong error)`);
                console.log(`   Expected pattern: ${expectedErrorPattern}`);
                console.log(`   Got: ${errorMessage}`);
                return {
                    file: testName,
                    passed: false,
                    error: `Wrong error. Expected "${expectedErrorPattern}", got "${errorMessage}"`
                };
            }
        }

        console.log(`${testName}: Failed unexpectedly`);
        console.log(`   Error: ${errorMessage}`);
        return {
            file: testName,
            passed: false,
            error: errorMessage
        };
    }
}

/**
 * Run all tests
 */
async function runAllTests(): Promise<void> {
    console.log('Generating test files...\n');
    await generateAllTestFiles();

    const testDir = path.join(process.cwd(), 'test-mbz-files');

    console.log('\nRunning tests...\n');

    const tests: Array<{
        name: string;
        file: string;
        shouldFail: boolean;
        expectedError?: string;
    }> = [
            {
                name: 'Valid MBZ',
                file: 'valid.mbz',
                shouldFail: false
            },
            {
                name: 'No Activities Directory',
                file: 'invalid-no-activities.mbz',
                shouldFail: true,
                expectedError: 'Activities directory not found'
            },
            {
                name: 'Empty Activities Directory',
                file: 'invalid-empty-activities.mbz',
                shouldFail: true,
                expectedError: 'No forum folder found'
            },
            {
                name: 'Missing forum.xml',
                file: 'invalid-no-forum-xml.mbz',
                shouldFail: true,
                expectedError: 'forum.xml not found'
            },
            {
                name: 'Invalid XML',
                file: 'invalid-invalid-xml.mbz',
                shouldFail: true,
                expectedError: 'Failed to parse forum.xml'
            },
            {
                name: 'Empty XML',
                file: 'invalid-empty-xml.mbz',
                shouldFail: true,
                expectedError: 'Failed to parse forum.xml'
            },
            {
                name: 'No Discussions',
                file: 'invalid-no-discussions.mbz',
                shouldFail: false // Should succeed but return empty results
            },
            {
                name: 'Malformed Posts',
                file: 'invalid-malformed-posts.mbz',
                shouldFail: false // Should succeed but skip malformed posts
            }
        ];

    const results: TestResult[] = [];

    for (const test of tests) {
        const mbzPath = path.join(testDir, test.file);
        const result = await runTest(
            test.name,
            mbzPath,
            test.shouldFail,
            test.expectedError
        );
        results.push(result);
        console.log('');
    }

    console.log('Test Summary');
    console.log('===============');
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    console.log(`Total: ${results.length}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);

    if (failed > 0) {
        console.log('\nFailed tests:');
        results.filter(r => !r.passed).forEach(r => {
            console.log(`  - ${r.file}: ${r.error}`);
        });
    }

    // Cleanup test files
    console.log('\n Cleaning up...');
    fs.rmSync(testDir, { recursive: true, force: true });

    process.exit(failed > 0 ? 1 : 0);
}

// Run if executed directly
if (require.main === module) {
    runAllTests().catch(console.error);
}

export { runAllTests, runTest };