// Simple test script to verify tenant ads endpoint
const axios = require("axios");

async function testTenantAds() {
  try {
    console.log("🧪 Testing tenant ads endpoint...");

    // Test the public endpoint
    const response = await axios.get(
      "http://localhost:5000/api/settings/tenant-ads/public/page/home?tenantId=main"
    );

    console.log("✅ Success! Response:", response.data);
    console.log(
      "📊 Number of ads:",
      response.data.HEADER ? response.data.HEADER.length : 0
    );
  } catch (error) {
    console.error("❌ Error testing endpoint:", error.message);
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    }
  }
}

testTenantAds();



