const fs = require('fs');
const path = require('path');

interface VintedItem {
  id: number;
  title: string;
  brand_title?: string;
  brand?: string;
  price?: string;
  url?: string;
}

interface VintedFavoritesResponse {
  items: VintedItem[];
  pagination?: {
    next_page_token?: string;
  };
}

interface FavoriteItem {
  id: number;
  title: string;
  brand: string;
  price?: string;
  url?: string;
}

/**
 * Fetches all favorites from Vinted API with pagination
 *
 * IMPORTANT: Before running, update the cookies and headers from your browser:
 * 1. Open https://www.vinted.com/member/items/favourite_list
 * 2. Open DevTools (F12) -> Network tab
 * 3. Refresh the page and find the request to /items/favourites
 * 4. Copy the Cookie header and update COOKIES constant below
 * 5. Copy the x-csrf-token and update CSRF_TOKEN constant below
 */

// ========== CONFIGURATION - UPDATE THESE ==========
const USER_ID = '88588889';
const COOKIES = '__ps_r=https://pro-docs.svc.vinted.com/; __ps_lu=https://www.vinted.com/pro; __ps_did=pscrb_2ea90f54-71b2-4771-ce1c-12e084a7c379; __ps_fva=1754408840802; _rdt_uuid=1754989128351.c6efe457-6dc6-43a9-85b6-4a43e4ba8c10; v_udt=aldxc1JMMEJzSUJVbS9TZE1PZkVSUDhoL3BMRS0tNzRpSm9qNDZPa1JaVUx5bi0tYStrbFNRZFYweGNGczZiZmJMaTVaQT09; anonymous-locale=en-us-fr; domain_selected=true; OptanonAlertBoxClosed=2025-11-04T16:04:46.524Z; eupubconsent-v2=CQaXAdgQaXAdgAcABBENCDFsAP_gAEPgAAwILNtR_G__bWlr-Tb3afpkeYxP99hr7sQxBgbJk24FzLvW7JwSx2E5NAzatqIKmRIAu3TBIQNlHJDURVCgKIgVryDMaEyUoTNKJ6BkiBMRI2JYCFxvm4pjWQCY5vr99lc1mB-N7dr82dzyy4hHn3a5_2S1WJCdIYetDfn8ZBKT-9IEd_x8v4v4_F7pE2-eS1n_pGvp6j9-YlM_dBmxt-bSffzPn_frk_e7X_vd_n37v84XH77v_4LMgAmGhUQRlkQABAoGAECABQVhABQIAgAASBogIATBgU5AwAXWEyAEAKAAYIAQAAgwABAAAJAAhEAFABAIAAIBAoAAwAIAgIAGBgADABYiAQAAgOgYpgQQCBYAJGZVBpgSgAJBAS2VCCQBAgrhCEWeAQQIiYKAAAEAAoCAAB4LAQkkBKxIIAuIJoAACAAAKIECBFIWYAgoDNFoLwJOoyNMAwfMEySnQZAEwRkZJsQm_CYeKQogAAAA.f_wACHwAAAAA; OTAdditionalConsentString=1~43.46.55.61.70.83.89.93.108.117.122.124.135.143.144.147.149.159.192.196.211.228.230.239.259.266.286.291.311.320.322.323.327.367.371.385.394.407.415.424.430.436.445.486.491.494.495.522.523.540.550.560.568.574.576.584.587.591.737.802.803.820.839.864.899.904.922.931.938.959.979.981.985.1003.1027.1031.1040.1046.1051.1053.1067.1092.1095.1097.1099.1107.1109.1135.1143.1149.1152.1162.1166.1186.1188.1205.1215.1226.1227.1230.1252.1268.1270.1276.1284.1290.1301.1307.1312.1329.1345.1356.1375.1403.1415.1416.1421.1423.1440.1449.1455.1495.1512.1516.1525.1540.1548.1555.1558.1570.1577.1579.1583.1584.1603.1616.1638.1651.1653.1659.1667.1677.1678.1682.1697.1699.1703.1712.1716.1721.1725.1732.1745.1750.1765.1782.1786.1800.1810.1825.1827.1832.1838.1840.1842.1843.1845.1859.1870.1878.1880.1889.1917.1929.1942.1944.1962.1963.1964.1967.1968.1969.1978.1985.1987.2003.2008.2027.2035.2039.2047.2052.2056.2064.2068.2072.2074.2088.2090.2103.2107.2109.2115.2124.2130.2133.2135.2137.2140.2147.2156.2166.2177.2186.2205.2213.2216.2219.2220.2222.2225.2234.2253.2275.2279.2282.2309.2312.2316.2322.2325.2328.2331.2335.2336.2343.2354.2358.2359.2370.2376.2377.2387.2400.2403.2405.2407.2411.2414.2416.2418.2425.2440.2447.2461.2465.2468.2472.2477.2484.2486.2488.2493.2498.2501.2510.2517.2526.2527.2532.2535.2542.2552.2563.2564.2567.2568.2569.2571.2572.2575.2577.2583.2584.2596.2604.2605.2608.2609.2610.2612.2614.2621.2627.2628.2629.2633.2636.2642.2643.2645.2646.2650.2651.2652.2656.2657.2658.2660.2661.2669.2670.2677.2681.2684.2687.2690.2695.2698.2713.2714.2729.2739.2767.2768.2770.2772.2784.2787.2791.2792.2798.2801.2805.2812.2813.2816.2817.2821.2822.2827.2830.2831.2833.2834.2838.2839.2844.2846.2849.2850.2852.2854.2860.2862.2863.2865.2867.2869.2873.2874.2875.2876.2878.2880.2881.2882.2883.2884.2886.2887.2888.2889.2891.2893.2894.2895.2897.2898.2900.2901.2908.2909.2916.2917.2918.2920.2922.2923.2927.2929.2930.2931.2940.2941.2947.2949.2950.2956.2958.2961.2963.2964.2965.2966.2968.2973.2975.2979.2980.2981.2983.2985.2986.2987.2994.2995.2997.2999.3000.3002.3003.3005.3008.3009.3010.3012.3016.3017.3018.3019.3028.3034.3038.3043.3052.3053.3055.3058.3059.3063.3066.3068.3070.3073.3074.3075.3076.3077.3089.3090.3093.3094.3095.3097.3099.3100.3106.3109.3112.3117.3119.3126.3127.3128.3130.3135.3136.3145.3150.3151.3154.3155.3163.3167.3172.3173.3182.3183.3184.3185.3187.3188.3189.3190.3194.3196.3209.3210.3211.3214.3215.3217.3222.3223.3225.3226.3227.3228.3230.3231.3234.3235.3236.3237.3238.3240.3244.3245.3250.3251.3253.3257.3260.3270.3272.3281.3288.3290.3292.3293.3296.3299.3300.3306.3307.3309.3314.3315.3316.3318.3324.3328.3330.3331.3531.3731.3831.4131.4531.4631.4731.4831.5231.6931.7235.7831.7931.8931.9731.10231.10631.10831.11031.11531.13632.13731.14034.14133.14237.14332.15731.16831.16931.21233.23031.25131.25931.26031.26631.26831.27731.27831.28031.28731.28831.29631.32531.33931.34231.34631.36831.39131.39531.40632.41131.41531.43631.43731.43831.45931.47232.47531.48131.49231; _gcl_au=1.1.1173393217.1762272287; _ga=GA1.1.1342463587.1762272287; _fbp=fb.1.1762272287260.270685927207678024; is_shipping_fees_applied_info_banner_dismissed=false; anon_id=4683f9ba-2b34-4e70-b480-65784e53e2a0; v_uid=88588889; v_sid=59a7651e-1762516610; homepage_session_id=ab1bca26-06a1-49ba-a0e0-bf4bd84be6e0; anon_id=4683f9ba-2b34-4e70-b480-65784e53e2a0; _cc_id=f209c750a383baa80d0d78a33b017742; panoramaId_expiry=1763121430628; panoramaId=98c1aa7a2fe21a3828a98b311a43185ca02cfcd4cc8289ee3d48071b51295f0a; panoramaIdType=panoDevice; __cf_bm=OuzPkanlxmxmKH8o6EFBWSWf0e9vMYhZJGQ0U7fL0so-1762531266-1.0.1.1-jxGgMSw7NP99BkuTXV7eYNzb7JNgi_U5DUrTPTrSUNe.f_TNOUHtVkNEADrkKpycfwrWMd4m4Tf4Ju_eI73evxyMezHBH5fM3CDQULDgrYcbkZBTfJOlHA9dZX1mSP62; access_token_web=eyJraWQiOiJFNTdZZHJ1SHBsQWp1MmNObzFEb3JIM2oyN0J1NS1zX09QNVB3UGlobjVNIiwiYWxnIjoiUFMyNTYifQ.eyJhY2NvdW50X2lkIjo2MzYzODQ5NSwiYXBwX2lkIjo0LCJhdWQiOiJmci5jb3JlLmFwaSIsImNsaWVudF9pZCI6IndlYiIsImV4cCI6MTc2MjUzODQ2OCwiaWF0IjoxNzYyNTMxMjY4LCJpc3MiOiJ2aW50ZWQtaWFtLXNlcnZpY2UiLCJsb2dpbl90eXBlIjozLCJwdXJwb3NlIjoiYWNjZXNzIiwic2NvcGUiOiJ1c2VyIiwic2lkIjoiNTlhNzY1MWUtMTc2MjUxNjYxMCIsInN1YiI6Ijg4NTg4ODg5IiwiY2MiOiJERSIsImFuaWQiOiI0NjgzZjliYS0yYjM0LTRlNzAtYjQ4MC02NTc4NGU1M2UyYTAiLCJhY3QiOnsic3ViIjoiODg1ODg4ODkifX0.nK-1rFWae608zgjmExdLKwAYeozjaIh3pTf1qbZR87xag0cuJoIUT4Clv0NPdEG1brU_VNWjMSIJbXV8n39jYvV6I7NzQlPbEwcn1msaNwL9fkkoiV1yCEoePGXp-1FMIFoSf1HMCfnvFQW9I2bDw_E-czNYCtSl-Dm4WC5ClMA0Ix8EcwOLCjq4lB_5SM4jB1RUljP9Xj6g37DVBBgRnxz8QXSEU9yY76tEfsBco4kkW15u8dOmvjulkf0CafuPdtQgVir-J6rFsr-mfzJkJzTLW-gtctne5ea5J-fY--N0jCR9RpVvwMCe9eOI7Ar3kGdc4q7gEAmX9VfKsspXvw; refresh_token_web=eyJraWQiOiJFNTdZZHJ1SHBsQWp1MmNObzFEb3JIM2oyN0J1NS1zX09QNVB3UGlobjVNIiwiYWxnIjoiUFMyNTYifQ.eyJhY2NvdW50X2lkIjo2MzYzODQ5NSwiYXBwX2lkIjo0LCJhdWQiOiJmci5jb3JlLmFwaSIsImNsaWVudF9pZCI6IndlYiIsImV4cCI6MTc2MzEzNjA2OCwiaWF0IjoxNzYyNTMxMjY4LCJpc3MiOiJ2aW50ZWQtaWFtLXNlcnZpY2UiLCJsb2dpbl90eXBlIjozLCJwdXJwb3NlIjoicmVmcmVzaCIsInNjb3BlIjoidXNlciIsInNpZCI6IjU5YTc2NTFlLTE3NjI1MTY2MTAiLCJzdWIiOiI4ODU4ODg4OSIsImNjIjoiREUiLCJhbmlkIjoiNDY4M2Y5YmEtMmIzNC00ZTcwLWI0ODAtNjU3ODRlNTNlMmEwIiwiYWN0Ijp7InN1YiI6Ijg4NTg4ODg5In19.Fkn5v3J3na1CxGWG6O085Z_MKvPXCpAbxuHZXBIbsvpoJwiYR3gg6NBBQZHRJnV8bb2TPYpZo5gIXpKWgib0Tv5o4jhn0lOJGIwJ1pmxcszRBXl4AsfJasXF29IIsIsusuge8PV0IA86bvxPLn7DkkFB1xBf3k_A0-iPdtUBNS99E4hR70NugTReOouw4RnJfdRSC1uu3ClSXLOVhiLK12sl0-33mrkMc3uI1v_5QOcpbdoDoMSKqfolOnkdSo9bvyF3Ul02nNyHQrj7t2SmRhWjJue1Zj0hjm3S5fpJBq3oca7I0V-Og8H0k9ed9vQstrJ8yIFoboiqEY1jiwADeQ; cf_clearance=bVeVtQUZHP0nA0tAJkNIlLQoBTMoiKH5hT6AhaS8sAE-1762531268-1.2.1.1-Cg0AXvcKD10VJzVqZUdDsTPp336.wLDrIYC_.8b8MuRixIgk3NN40Gx3r.OcL6G6hevMoVZpattoPwSh.9rILd75vMNWMZ15envjMXVaMQpe1vIwubkdar7puCTz1am0cMijwD9ypolyOzKZPVKOPUAoeeAfRa93kg2FaffNUuaCLrldfe0aPis3X6TSRvU4XyrmojYeorB03vyxg94n5jQKoMG4Lq_Md.qnx3W72QE; viewport_size=612; __ps_sr=_; __ps_slu=https://www.vinted.com/session-refresh?ref_url=%2Fmember%2Fitems%2Ffavourite_list; uuid=0F221B66-13A8-4C7E-A23D-3C9CDC1F8DB7; OptanonConsent=isGpcEnabled=0&datestamp=Fri+Nov+07+2025+21%3A10%3A12+GMT%2B0500+(Uzbekistan+Standard+Time)&version=202508.2.0&browserGpcFlag=0&isIABGlobal=false&consentId=88588889&identifierType=Cookie+Unique+Id&isAnonUser=1&hosts=&interactionCount=2&landingPath=NotLandingPage&groups=C0001%3A1%2CC0002%3A1%2CC0003%3A1%2CC0004%3A1%2CC0005%3A1%2CV2STACK42%3A1%2CC0015%3A1%2CC0035%3A1%2CC0038%3A1&genVendors=V1%3A1%2C&intType=1&geolocation=DE%3BBE&AwaitingReconsent=false; _ga_4XRP98X6MW=GS2.1.s1762531266$o4$g1$t1762531812$j51$l0$h0; _ga_ZJHK1N3D75=GS2.1.s1762531266$o4$g1$t1762531812$j51$l0$h0; cto_bidid=AU0Zn19pejZzMSUyQkFEQ1lFeFhyS2dSZXZ3UzJ3azJneDV3Um1iS0UzZ2NOUTQwcTYyRWNzYWM0QTNBUGUwdXdBenFBNmg3OGdzWFVYcHM2MzRUVDg5Snk3Rk5ENlVqZnNPWWg2blVwekdOWWp0ck5iRFV4TVZEeXpUR2IxdEpveFR6JTJGQ3pPcG9iNHF0bDNybU10eXNpcU10Z0Z3JTNEJTNE; cto_bundle=ENvkTl9QMjdyczltZyUyRndtMHU5dnBEa3BMZklZSzNIR3VWVTNvS2VGJTJCa2tocG1ZMlFEUUJLTGhSTkFka1NESyUyQjk2dGVQNFpmaTlnNWpxbVFhRDMwb01zekJLc0hpRzNOb0pNTzBzaVJzNkJNM3JOU3ZXWnFpZVpwNjEwV2w3VjlJbDFXOVN5VFFuRmJXVE93eSUyQm5IYVdUQ2NWSVJ5czRVa3Q4TFY5ZTd1c3VyM2tzSW5qenVNSDRYOCUyRmtjSXBVJTJGQVJ0V2Y; datadome=Q2AKxk~ZUcC6fHKha8Dx8LAYbRCsutmfWUEIZ1Ma1qEpY0mhPWQYXern8bDPyJjh4jtlekHE5ywcC8kg0c2nZWwEahIOQhhBfXKnkLPFdoYUEfDXoKzBi_Ht5My_b2yT; _vinted_fr_session=b2FaQno1V1FtWnJwV3JTMFV2ZW9lRkdPcDErUHhDRlZscXJCZ3NPWlI3SXFkYVYxdmZ2TkhSZzRrR0t3ZzJJZENHb3NxTWVTLzFYTDFtUHZPckppelVkaGo5Mko0VW1EajZza3RGd0JSR3AvNDJ1YURHQmFpelhPb2lnMFZxV2UwVVhMZHkvS0RabG1qaFYyQnhJWnpBNGFEMVR2NzMwKzRwcTY4U2FnZDVqcHFpcStmTEFVQVpHUnhCbnJHVEkrQWtpc0EwN2NsZjZlZ3dZNG95azBVNlMwYlVxaHRsRDhlakVIMmRsS2hQREpnc2hYd0wvZ2VjY2E3eGl6YnBuZ2RkMEp3eS91OGRFaTlvQXQ2RmdnVXRlSkRvRFdKK0hVcnFNbW9LTXBlWEtSa0djT28xazBmWTBtbm4yQkx1aXYtLXZHczNmVDRxbTA5cmZ4SS9kN2pKYmc9PQ%3D%3D--fd6c72e9717525377774efff6870cfcc93deaef9; __gads=ID=c1fdd02c4512a5b8:T=1754410686:RT=1762532225:S=ALNI_MZ2W-WL0wwFFdjFgW6DNgwCqXVS5g; __gpi=UID=000011010aa5ae6f:T=1754410686:RT=1762532225:S=ALNI_MbxSR8wAHmQ7mPOIb0bMGg1KeJOAQ; __eoi=ID=5b35947136398543:T=1754410686:RT=1762532225:S=AA-AfjYq2csobSsDPwaR1ezVWR8h';
const CSRF_TOKEN = '75f6c9fa-dc8e-4e52-a000-e09dd4084b3e';
const ANON_ID = '4683f9ba-2b34-4e70-b480-65784e53e2a0';
// ==================================================

const BASE_URL = 'https://www.vinted.com/api/v2';
const DELAY_BETWEEN_REQUESTS = 1000; // 1 second delay to be polite

async function fetchFavoritesPage(nextPageToken?: string): Promise<VintedFavoritesResponse | null> {
  const url = nextPageToken
    ? `${BASE_URL}/users/${USER_ID}/items/favourites?next_page_token=${nextPageToken}`
    : `${BASE_URL}/users/${USER_ID}/items/favourites`;

  console.log(`Fetching: ${url}`);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'accept': 'application/json, text/plain, */*,image/webp',
        'accept-language': 'en-fr',
        'cookie': COOKIES,
        'referer': 'https://www.vinted.com/member/items/favourite_list',
        'sec-ch-ua': '"Google Chrome";v="141", "Not?A_Brand";v="8", "Chromium";v="141"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"macOS"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
        'x-anon-id': ANON_ID,
        'x-csrf-token': CSRF_TOKEN,
        'x-money-object': 'true',
      },
    });

    if (!response.ok) {
      console.error(`\n❌ Error: ${response.status} ${response.statusText}`);

      if (response.status === 401 || response.status === 403) {
        console.error('\n🔑 Authentication failed! Your tokens are expired or invalid.');
        console.error('\nPlease update the following in the script:');
        console.error('1. Open https://www.vinted.com/member/items/favourite_list in your browser');
        console.error('2. Open DevTools (F12) -> Network tab');
        console.error('3. Refresh the page');
        console.error('4. Find the request to "/items/favourites"');
        console.error('5. Copy these values from Request Headers:');
        console.error('   - Cookie (entire string)');
        console.error('   - x-csrf-token');
        console.error('   - x-anon-id');
        console.error('   - User ID from URL: /users/{USER_ID}/items/favourites');
        console.error('\n6. Update them in scripts/fetch-vinted-favorites.ts (lines 54-57)');
      }

      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Fetch error:', error);
    return null;
  }
}

async function fetchAllFavorites(): Promise<FavoriteItem[]> {
  const allItems: FavoriteItem[] = [];
  let nextPageToken: string | undefined = undefined;
  let pageNumber = 1;

  while (true) {
    console.log(`\nFetching page ${pageNumber}...`);

    const response = await fetchFavoritesPage(nextPageToken);

    if (!response || !response.items) {
      console.log('No more data or error occurred');
      break;
    }

    // Extract items
    const items = response.items.map((item: VintedItem) => ({
      id: item.id,
      title: item.title,
      brand: item.brand_title || item.brand || 'Unknown Brand',
      price: item.price,
      url: item.url,
    }));

    allItems.push(...items);
    console.log(`Found ${items.length} items on this page`);
    console.log(`Total items so far: ${allItems.length}`);

    // Check if there's a next page
    nextPageToken = response.pagination?.next_page_token;

    if (!nextPageToken) {
      console.log('\nNo more pages. Finished!');
      break;
    }

    // Wait before next request to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_REQUESTS));
    pageNumber++;
  }

  return allItems;
}

async function main() {
  console.log('Starting Vinted favorites scraper...');
  console.log(`User ID: ${USER_ID}\n`);

  const favorites = await fetchAllFavorites();

  console.log(`\n==============================`);
  console.log(`Total favorites found: ${favorites.length}`);
  console.log(`==============================\n`);

  // Save to JSON file
  const outputDir = path.join(__dirname, '..', 'data', 'vinted');
  const outputFile = path.join(outputDir, 'favorites.json');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputFile, JSON.stringify(favorites, null, 2), 'utf-8');
  console.log(`✓ Saved to: ${outputFile}`);

  // Save titles and brands to a simple text file
  const textFile = path.join(outputDir, 'favorites-list.txt');
  const textContent = favorites.map(item => `${item.title} - ${item.brand}`).join('\n');
  fs.writeFileSync(textFile, textContent, 'utf-8');
  console.log(`✓ Saved text list to: ${textFile}`);

  // Print some statistics
  const brandCounts = favorites.reduce((acc, item) => {
    acc[item.brand] = (acc[item.brand] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topBrands = Object.entries(brandCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  console.log('\nTop 10 brands in your favorites:');
  topBrands.forEach(([brand, count], index) => {
    console.log(`${index + 1}. ${brand}: ${count} items`);
  });
}

main().catch(console.error);
