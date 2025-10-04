/**
 * TypeScript client demo using OpenAPI-generated types.
 * Demonstrates type-safe communication with Python FastAPI server.
 */

import type { Camera } from '../../generated/typescript/types.gen.js';

const BASE_URL = 'http://localhost:8001';

// Type-safe API client functions using generated types
async function listCameras(status?: 'online' | 'offline'): Promise<Camera[]> {
  const url = new URL('/cameras', BASE_URL);
  if (status) url.searchParams.set('status', status);
  const response = await fetch(url);
  return response.json();
}

async function createCamera(body: { name: string; location?: string }): Promise<Camera> {
  const response = await fetch(`${BASE_URL}/cameras`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return response.json();
}

async function getCameraById(cameraId: string): Promise<Camera> {
  const response = await fetch(`${BASE_URL}/cameras/${cameraId}`);
  return response.json();
}

async function updateCamera(
  cameraId: string,
  body: { name?: string; location?: string; status?: 'online' | 'offline' }
): Promise<Camera> {
  const response = await fetch(`${BASE_URL}/cameras/${cameraId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return response.json();
}

async function deleteCamera(cameraId: string): Promise<void> {
  await fetch(`${BASE_URL}/cameras/${cameraId}`, { method: 'DELETE' });
}

async function runDemo() {
  console.log('🎬 TypeScript Client Demo - Contract-First Development\n');
  console.log('📡 Connecting to Python FastAPI server at http://localhost:8001\n');

  try {
    // 1. List all cameras
    console.log('1️⃣  Listing all cameras...');
    const allCameras = await listCameras();
    console.log(`   Found ${allCameras.length} cameras`);
    allCameras.forEach(cam => {
      console.log(`   • ${cam.name} (${cam.id}) - ${cam.status}`);
    });
    console.log();

    // 2. Create a new camera
    console.log('2️⃣  Creating new camera...');
    const newCamera = await createCamera({
      name: 'TypeScript Demo Camera',
      location: 'Building C - Created by TS Client'
    });
    console.log(`   ✅ Created: ${newCamera.name} (${newCamera.id})`);
    console.log();

    // 3. Get specific camera by ID
    console.log('3️⃣  Fetching camera by ID...');
    const fetchedCamera = await getCameraById(newCamera.id);
    console.log(`   📹 ${fetchedCamera.name}`);
    console.log(`      Location: ${fetchedCamera.location || 'N/A'}`);
    console.log(`      Status: ${fetchedCamera.status}`);
    console.log();

    // 4. Update camera
    console.log('4️⃣  Updating camera status...');
    const updatedCamera = await updateCamera(newCamera.id, {
      status: 'offline',
      location: 'Building C - Updated!'
    });
    console.log(`   ✅ Updated: ${updatedCamera.name} -> ${updatedCamera.status}`);
    console.log(`      New location: ${updatedCamera.location}`);
    console.log();

    // 5. Filter cameras by status
    console.log('5️⃣  Filtering online cameras...');
    const onlineCameras = await listCameras('online');
    console.log(`   Found ${onlineCameras.length} online cameras`);
    console.log();

    // 6. Delete camera
    console.log('6️⃣  Cleaning up - deleting demo camera...');
    await deleteCamera(newCamera.id);
    console.log(`   ✅ Deleted camera ${newCamera.id}`);
    console.log();

    // 7. Final count
    console.log('7️⃣  Final camera count...');
    const finalCameras = await listCameras();
    console.log(`   📊 Total cameras: ${finalCameras.length}`);
    console.log();

    console.log('✨ Demo completed successfully!');
    console.log('🎯 Key takeaways:');
    console.log('   • TypeScript client talks to Python server seamlessly');
    console.log('   • Full type safety from OpenAPI contract');
    console.log('   • Both sides use generated code from same spec');
    console.log('   • Zero integration surprises!');

  } catch (error) {
    console.error('💥 Unexpected error:', error);
    console.log('\n⚠️  Make sure the Python server is running:');
    console.log('   cd showcase/python-server');
    console.log('   python main.py');
  }
}

// Run the demo
runDemo();