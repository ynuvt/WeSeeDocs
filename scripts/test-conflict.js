const PORT = process.env.PORT || 3000;
const BASE_URL = `http://localhost:${PORT}/api/drafts`;

async function runTest() {
  console.log('Starting concurrency proof-of-correctness test...');
  try {
    // 1. Client A GETs draft #1
    console.log('1. Client A fetching draft #1...');
    const resA = await fetch(`${BASE_URL}/1`);
    if (!resA.ok) {
      throw new Error(`Failed to fetch draft #1 (A): status ${resA.status}`);
    }
    const draftA = await resA.json();
    const versionA = draftA.version;
    console.log(`   Client A loaded draft #1. Current Version: ${versionA}`);

    // 2. Client B GETs draft #1
    console.log('2. Client B fetching draft #1...');
    const resB = await fetch(`${BASE_URL}/1`);
    if (!resB.ok) {
      throw new Error(`Failed to fetch draft #1 (B): status ${resB.status}`);
    }
    const draftB = await resB.json();
    const versionB = draftB.version;
    console.log(`   Client B loaded draft #1. Current Version: ${versionB}`);

    if (versionA !== versionB) {
      throw new Error(`Versions don't match initial state: V_A=${versionA}, V_B=${versionB}`);
    }

    // 3. Client A PUTs with versionA (expect 200, new version = versionA + 1)
    console.log(`3. Client A updating draft #1 with version = ${versionA}...`);
    const updatePayloadA = {
      title: "Title updated by Client A",
      type: draftA.type,
      body: "Body updated by Client A",
      tags: draftA.tags,
      status: draftA.status,
      version: versionA
    };
    
    const putResA = await fetch(`${BASE_URL}/1`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatePayloadA)
    });

    if (!putResA.ok) {
      throw new Error(`Client A update failed: status ${putResA.status}`);
    }
    const updatedA = await putResA.json();
    console.log(`   Client A update succeeded. New Version: ${updatedA.version}`);
    
    if (updatedA.version !== versionA + 1) {
      throw new Error(`Expected new version to be ${versionA + 1}, got ${updatedA.version}`);
    }

    // 4. Client B PUTs with versionB (expect 409 conflict, current.version = versionA + 1)
    console.log(`4. Client B updating draft #1 with stale version = ${versionB}...`);
    const updatePayloadB = {
      title: "Title updated by Client B",
      type: draftB.type,
      body: "Body updated by Client B",
      tags: draftB.tags,
      status: draftB.status,
      version: versionB
    };

    const putResB = await fetch(`${BASE_URL}/1`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatePayloadB)
    });

    console.log(`   Client B response status: ${putResB.status}`);
    if (putResB.status !== 409) {
      throw new Error(`Expected 409 Conflict, but got status ${putResB.status}`);
    }

    const conflictDetails = await putResB.json();
    console.log(`   Conflict details returned:`, conflictDetails);

    if (conflictDetails.error !== 'conflict') {
      throw new Error(`Expected error field to be 'conflict', got '${conflictDetails.error}'`);
    }

    if (!conflictDetails.current || conflictDetails.current.version !== updatedA.version) {
      throw new Error(`Expected current version returned in conflict info to be ${updatedA.version}`);
    }

    // 5. Test validation checking: PUT with invalid status returns 400
    console.log('5. Testing input validation schema rejects bad data...');
    const invalidPayload = {
      ...updatePayloadA,
      status: "INVALID_STATUS",
      version: updatedA.version
    };
    const validationRes = await fetch(`${BASE_URL}/1`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidPayload)
    });
    console.log(`   Validation check response status: ${validationRes.status}`);
    if (validationRes.status !== 400) {
      throw new Error(`Expected 400 Bad Request on invalid status, got ${validationRes.status}`);
    }
    const valDetails = await validationRes.json();
    console.log(`   Validation error details returned:`, JSON.stringify(valDetails));

    console.log('\n======================================');
    console.log('PASS: Concurrency safety and validation tests successful!');
    console.log('======================================');
  } catch (error) {
    console.error('\n======================================');
    console.error(`FAIL: Test script failed: ${error.message}`);
    console.error('======================================');
    process.exit(1);
  }
}

runTest();
