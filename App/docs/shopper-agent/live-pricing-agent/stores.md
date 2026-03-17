### Store to tests
Here are the major Canadian grocery chains worth testing, grouped by parent company:

Loblaw Companies (same platform as Loblaws — high chance of working)

┌─────────────────────────┬───────────────────────────┬─────────────────────────────────────┐
│          Store          │            URL            │                Notes                │
├─────────────────────────┼───────────────────────────┼─────────────────────────────────────┤
│ Real Canadian           │ realcanadiansuperstore.ca │ Biggest Loblaw banner, Western      │
│ Superstore              │                           │ Canada                              │
├─────────────────────────┼───────────────────────────┼─────────────────────────────────────┤
│ No Frills               │ nofrills.ca               │ Discount banner, nationwide         │
├─────────────────────────┼───────────────────────────┼─────────────────────────────────────┤
│ Shoppers Drug Mart      │ shoppersdrugmart.ca       │ Carries groceries, huge network     │
├─────────────────────────┼───────────────────────────┼─────────────────────────────────────┤
│ T&T Supermarket         │ tnt-supermarket.com       │ Asian grocery, Loblaw-owned         │
├─────────────────────────┼───────────────────────────┼─────────────────────────────────────┤
│ Your Independent Grocer │ yourindependentgrocer.ca  │ Smaller communities                 │
└─────────────────────────┴───────────────────────────┴─────────────────────────────────────┘

Empire Company (Sobeys)

┌──────────┬─────────────┬─────────────────────┐
│  Store   │     URL     │        Notes        │
├──────────┼─────────────┼─────────────────────┤
│ Sobeys   │ sobeys.com  │ #2 grocer in Canada │
├──────────┼─────────────┼─────────────────────┤
│ FreshCo  │ freshco.com │ Discount banner     │
├──────────┼─────────────┼─────────────────────┤
│ Farm Boy │ farmboy.ca  │ Premium, Ontario    │
├──────────┼─────────────┼─────────────────────┤
│ Safeway  │ safeway.ca  │ Western Canada      │
└──────────┴─────────────┴─────────────────────┘

Metro Inc.

┌─────────────┬───────────────┬──────────────────┐
│    Store    │      URL      │      Notes       │
├─────────────┼───────────────┼──────────────────┤
│ Metro       │ metro.ca      │ Ontario & Quebec │
├─────────────┼───────────────┼──────────────────┤
│ Food Basics │ foodbasics.ca │ Discount banner  │
└─────────────┴───────────────┴──────────────────┘

Other

┌────────────────┬────────────────┬────────────────────────────────────────┐
│     Store      │      URL       │                 Notes                  │
├────────────────┼────────────────┼────────────────────────────────────────┤
│ Walmart Canada │ walmart.ca     │ Largest retailer, huge grocery section │
├────────────────┼────────────────┼────────────────────────────────────────┤
│ Giant Tiger    │ gianttiger.com │ Discount, nationwide                   │
└────────────────┴────────────────┴────────────────────────────────────────┘

### What works? 
Here's the full picture of what works:

Results Summary

Works via SSR (same approach as Loblaws)

┌─────────────────────┬─────────────┬───────────┬───────────────────────────────────────────┐
│        Store        │  Platform   │ Products  │            Price Data Quality             │
├─────────────────────┼─────────────┼───────────┼───────────────────────────────────────────┤
│ Loblaws             │ Next.js     │ ~50/page  │ price, display_price, was_price,          │
│                     │ (PCX)       │           │ package_sizing, deals                     │
├─────────────────────┼─────────────┼───────────┼───────────────────────────────────────────┤
│ Real Canadian       │ Next.js     │ ~50/page  │ Same as Loblaws                           │
│ Superstore          │ (PCX)       │           │                                           │
├─────────────────────┼─────────────┼───────────┼───────────────────────────────────────────┤
│ No Frills           │ Next.js     │ ~50/page  │ Same as Loblaws                           │
│                     │ (PCX)       │           │                                           │
├─────────────────────┼─────────────┼───────────┼───────────────────────────────────────────┤
│ Your Independent    │ Next.js     │ ~50/page  │ Same as Loblaws                           │
│ Grocer              │ (PCX)       │           │                                           │
├─────────────────────┼─────────────┼───────────┼───────────────────────────────────────────┤
│ Shoppers Drug Mart  │ Next.js     │ ~100/page │ Same as Loblaws (but includes             │
│                     │ (PCX)       │           │ non-grocery)                              │
├─────────────────────┼─────────────┼───────────┼───────────────────────────────────────────┤
│ Walmart Canada      │ Next.js     │ ~48/page  │ price, linePrice, unitPrice, wasPrice,    │
│                     │             │           │ savings                                   │
└─────────────────────┴─────────────┴───────────┴───────────────────────────────────────────┘

Does NOT work (client-side rendering, blocked, or no SSR data)

┌───────────────────────┬───────────────────────────────────────┐
│         Store         │                 Issue                 │
├───────────────────────┼───────────────────────────────────────┤
│ Sobeys                │ 404 on search, fully client-side      │
├───────────────────────┼───────────────────────────────────────┤
│ Metro                 │ 403 blocked, no product data in HTML  │
├───────────────────────┼───────────────────────────────────────┤
│ Food Basics           │ 403 blocked                           │
├───────────────────────┼───────────────────────────────────────┤
│ FreshCo               │ 404 on search                         │
├───────────────────────┼───────────────────────────────────────┤
│ Farm Boy              │ 404 on search                         │
├───────────────────────┼───────────────────────────────────────┤
│ Giant Tiger           │ Client-side rendered, no data in HTML │
├───────────────────────┼───────────────────────────────────────┤
│ T&T Supermarket       │ Client-side rendered                  │
├───────────────────────┼───────────────────────────────────────┤
│ Voila (Sobeys online) │ 1.5MB SPA, no SSR data                │
└───────────────────────┴───────────────────────────────────────┘