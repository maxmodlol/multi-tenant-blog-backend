// Script to create test ads for local development and debugging
// Run with: npx ts-node src/scripts/createTestAds.ts

import { AppDataSource } from "../config/data-source";
import {
  TenantAdSetting,
  TenantAdPlacement,
  TenantAdAppearance,
} from "../models/TenantAdSetting";

const testAds = [
  {
    title: "TEST: Simple AdSense Ad",
    placement: TenantAdPlacement.HEADER,
    appearance: TenantAdAppearance.CENTERED,
    codeSnippet: `<ins class="adsbygoogle"
     style="display:block"
     data-ad-client="ca-pub-5603341970726415"
     data-ad-slot="1234567890"
     data-ad-format="auto"
     data-full-width-responsive="true"></ins>
<script>
     (adsbygoogle = window.adsbygoogle || []).push({});
</script>`,
    scope: "main",
    priority: 1,
  },
  {
    title: "TEST: Problematic GPT Ad (like production)",
    placement: TenantAdPlacement.SIDEBAR,
    appearance: TenantAdAppearance.STICKY,
    codeSnippet: `<!-- /23282436620/lsektor.comStickyAds -->
<div id='div-gpt-ad-1756916838274-0' style='min-width:300px; min-height:250px;'>
  <script>
    googletag.cmd.push(function() { 
      googletag.defineSlot('/23282436620/lsektor.comStickyAds', [[300, 250]], 'div-gpt-ad-1756916838274-0')
        .addService(googletag.pubads());
      googletag.display('div-gpt-ad-1756916838274-0'); 
    });
  </script>
</div>`,
    scope: "main",
    priority: 2,
  },
  {
    title: "TEST: Another GPT Ad with SAME slot ID (causes conflict)",
    placement: TenantAdPlacement.FOOTER,
    appearance: TenantAdAppearance.FULL_WIDTH,
    codeSnippet: `<!-- Duplicate slot ID - should cause error -->
<div id='div-gpt-ad-1756916838274-0' style='min-width:728px; min-height:90px;'>
  <script>
    googletag.cmd.push(function() { 
      googletag.defineSlot('/23282436620/lsektor.comStickyAds', [[728, 90]], 'div-gpt-ad-1756916838274-0')
        .addService(googletag.pubads());
      googletag.display('div-gpt-ad-1756916838274-0'); 
    });
  </script>
</div>`,
    scope: "main",
    priority: 3,
  },
  {
    title: "TEST: Inline GPT Ad Example",
    placement: TenantAdPlacement.BLOG_LIST_TOP,
    appearance: TenantAdAppearance.CENTERED,
    codeSnippet: `<!-- /23282436620/ArticleInlineAd1 -->
<div id='div-gpt-ad-1756917167350-0' style='min-width:300px; min-height:50px;'>
  <script>googletag.cmd.push(function() { googletag.display('div-gpt-ad-1756917167350-0'); });</script>
</div>`,
    scope: "main",
    priority: 4,
    positionOffset: 100,
  },
  {
    title: "TEST: Multiple AdSense Push (causes conflicts)",
    placement: TenantAdPlacement.HOME_HERO,
    appearance: TenantAdAppearance.CENTERED,
    codeSnippet: `<ins class="adsbygoogle"
     style="display:block"
     data-ad-client="ca-pub-5603341970726415"
     data-ad-slot="9876543210"
     data-ad-format="rectangle"></ins>
<script>
     (adsbygoogle = window.adsbygoogle || []).push({});
</script>
<script>
     // This second push should cause issues
     (adsbygoogle = window.adsbygoogle || []).push({});
</script>`,
    scope: "main",
    priority: 5,
  },
  {
    title: "TEST: Dangerous Script (should be blocked by validator)",
    placement: TenantAdPlacement.CATEGORY_TOP,
    appearance: TenantAdAppearance.LEFT_ALIGNED,
    codeSnippet: `<div>
  <script>
    // This should be caught by security validation
    document.write('<h1>Dangerous Script!</h1>');
    eval('alert("XSS attempt")');
    window.location = 'https://malicious-site.com';
  </script>
</div>`,
    scope: "main",
    priority: 6,
    isEnabled: false, // Disabled by default for safety
  },
];

async function createTestAds() {
  try {
    console.log("🧪 Creating test ads for local development...");
    await AppDataSource.initialize();

    const repo = AppDataSource.getRepository(TenantAdSetting);

    // Clean up existing test ads first
    console.log("🧹 Cleaning up existing test ads...");
    await repo.delete({
      title: { $like: "TEST:%" } as any,
    });

    console.log("➕ Creating new test ads...");

    for (const adData of testAds) {
      const ad = repo.create({
        tenantId: "main",
        placement: adData.placement,
        appearance: adData.appearance,
        codeSnippet: adData.codeSnippet,
        title: adData.title,
        scope: adData.scope,
        priority: adData.priority,
        positionOffset: adData.positionOffset,
        isEnabled: adData.isEnabled !== false, // Default to true unless explicitly false
        description: `Test ad created by createTestAds.ts script`,
      });

      const saved = await repo.save(ad);
      console.log(`✅ Created: ${saved.title} (ID: ${saved.id})`);
    }

    console.log(`\n🎯 Test Setup Complete!`);
    console.log(`Created ${testAds.length} test ads for local testing.`);
    console.log(`\n📋 Test Scenarios:`);
    console.log(
      `1. AdSense ads - Should work but may have multiple push issues`
    );
    console.log(
      `2. GPT ads with duplicate slot IDs - Should cause console errors`
    );
    console.log(
      `3. Inline GPT ads - Should fail due to missing googletag library`
    );
    console.log(`4. Dangerous scripts - Should be disabled by default`);
    console.log(`\n🚀 Next steps:`);
    console.log(`1. Start your frontend: npm run dev`);
    console.log(`2. Open browser dev tools (F12)`);
    console.log(`3. Navigate to your site and check console for errors`);
    console.log(`4. Look for the specific errors from production logs`);
    console.log(
      `\n🔧 To clean up test ads later, run this script with --cleanup flag`
    );
  } catch (error) {
    console.error("❌ Error creating test ads:", error);
  } finally {
    await AppDataSource.destroy();
  }
}

async function cleanupTestAds() {
  try {
    console.log("🧹 Cleaning up test ads...");
    await AppDataSource.initialize();

    const repo = AppDataSource.getRepository(TenantAdSetting);
    const result = await repo.delete({
      title: { $like: "TEST:%" } as any,
    });

    console.log(`✅ Cleaned up ${result.affected || 0} test ads`);
  } catch (error) {
    console.error("❌ Error cleaning up test ads:", error);
  } finally {
    await AppDataSource.destroy();
  }
}

// CLI handling
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes("--cleanup")) {
    cleanupTestAds();
  } else {
    createTestAds();
  }
}

export { createTestAds, cleanupTestAds };



