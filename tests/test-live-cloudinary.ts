import assert from "node:assert";
import {
  cloudinary,
  isCloudinaryConfigured,
  assertCloudinaryConfigured,
  getCloudinaryCloudName,
} from "../lib/storage/cloudinary";

async function verifyLiveCloudinary() {
  console.log("==================================================");
  console.log("   TESTING LIVE CLOUDINARY CONNECTIVITY           ");
  console.log("==================================================");

  // 1. Verify credentials presence
  const configured = isCloudinaryConfigured();
  console.log(`1. isCloudinaryConfigured: ${configured}`);

  if (!configured) {
    console.error("Cloudinary credentials are not detected or incomplete in .env.");
    process.exit(1);
  }

  const { cloudName } = assertCloudinaryConfigured();
  console.log(`2. Cloud Name detected: ${cloudName}`);

  // 3. Test ping against Cloudinary API
  console.log("3. Testing Cloudinary API ping / resource check...");
  try {
    const pingRes = await cloudinary.api.ping();
    console.log("   ✓ API Ping Response status:", pingRes.status);
    assert.strictEqual(pingRes.status, "ok");
  } catch (err: unknown) {
    console.error("   ✗ Cloudinary API Ping failed:", err instanceof Error ? err.message : err);
    process.exit(1);
  }

  // 4. Test actual upload with a 1x1 transparent PNG
  console.log("4. Testing actual upload to Cloudinary...");
  const testPublicId = `poppin/avatars/test_connectivity_${Date.now()}`;
  // 1x1 transparent PNG data URI
  const tinyPng = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

  let uploadResult;
  try {
    uploadResult = await cloudinary.uploader.upload(tinyPng, {
      public_id: testPublicId,
      resource_type: "image",
      folder: "poppin/avatars",
      overwrite: true,
    });
    console.log("   ✓ Upload successful! Public ID:", uploadResult.public_id);
    console.log("   ✓ Format:", uploadResult.format, "Bytes:", uploadResult.bytes);
    console.log("   ✓ Secure URL generated:", uploadResult.secure_url);
    assert.ok(uploadResult.secure_url.includes("res.cloudinary.com"));
  } catch (err: unknown) {
    console.error("   ✗ Cloudinary upload test failed:", err instanceof Error ? err.message : err);
    process.exit(1);
  }

  // 5. Test retrieving the uploaded resource
  console.log("5. Testing resource retrieval via Cloudinary API...");
  try {
    const resource = await cloudinary.api.resource(uploadResult.public_id, {
      resource_type: "image",
    });
    assert.strictEqual(resource.public_id, uploadResult.public_id);
    console.log("   ✓ Resource verified on Cloudinary server:", resource.public_id);
  } catch (err: unknown) {
    console.error("   ✗ Resource retrieval failed:", err instanceof Error ? err.message : err);
    process.exit(1);
  }

  // 6. Clean up: destroy test asset
  console.log("6. Cleaning up test asset from Cloudinary...");
  try {
    const destroyRes = await cloudinary.uploader.destroy(uploadResult.public_id, {
      resource_type: "image",
      invalidate: true,
    });
    console.log("   ✓ Cleanup result:", destroyRes.result);
    assert.ok(destroyRes.result === "ok" || destroyRes.result === "not found");
  } catch (err: unknown) {
    console.warn("   ! Cleanup warning:", err);
  }

  console.log("\n>>> LIVE CLOUDINARY CONNECTIVITY VERIFIED 100% SUCCESSFULLY! <<<");
}

verifyLiveCloudinary().catch((err) => {
  console.error("Live test failed:", err);
  process.exit(1);
});

