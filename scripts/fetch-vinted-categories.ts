/**
 * Fetch Vinted category IDs
 * To find out what catalog[] values to use for filtering
 */

async function fetchVintedCategories() {
  console.log("🔍 Fetching Vinted categories...\n");

  try {
    // Fetch from Vinted catalog endpoint
    const response = await fetch("https://www.vinted.de/api/v2/catalogs", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("✓ Categories fetched successfully!\n");
    console.log(JSON.stringify(data, null, 2));

    // Try to extract clothing/accessory categories
    if (data.catalogs) {
      console.log("\n📋 Main Categories:");
      data.catalogs.forEach((cat: any) => {
        console.log(`  ${cat.id} - ${cat.title} (${cat.code})`);
      });
    }
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

fetchVintedCategories();
