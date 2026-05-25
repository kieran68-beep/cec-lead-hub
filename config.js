// ============================================================
//  CEC LEAD HUB — CONFIGURATION FILE
//  Edit this file to update pricing, services, and settings.
//  No coding knowledge required — just change the numbers!
// ============================================================

const CEC_CONFIG = {

  // ----------------------------------------------------------
  //  GOOGLE SHEETS
  // ----------------------------------------------------------
  SHEET_ID: "1PRXReoaS65P9QzwSNC_VW3U4DVu6xbG-QMCO5LOTuI0",

  // The Google Apps Script Web App URL (you get this after deploying your script)
  // Replace the placeholder below with your actual deployed URL
  APPS_SCRIPT_URL: https://script.google.com/macros/s/AKfycbxILnESysGAG2UUwVCNgVjhKlhINSCMIW-2UlBuTBq2jCKeSZG9i0e3UxrW4j5YmIoXLA/exec

  // ----------------------------------------------------------
  //  TOOL LINKS
  // ----------------------------------------------------------
  COVERAGE_CHECKER_URL: "https://kieran68-beep.github.io/cec-coverage-checker/",

  // ----------------------------------------------------------
  //  LEAD STATUSES
  // ----------------------------------------------------------
  // Leads with these statuses are considered CLOSED and won't
  // appear in the active leads list on the homepage
  CLOSED_STATUSES: ["Booked in CM", "Lost", "Ignored", "Rejected See Notes"],

  ALL_STATUSES: [
    "Quoted",
    "Waiting Reply",
    "Chased",
    "Booked in CM",
    "Lost",
    "Ignored",
    "Rejected See Notes"
  ],

  // ----------------------------------------------------------
  //  LEAD SOURCES
  // ----------------------------------------------------------
  LEAD_SOURCES: [
    "Email",
    "Website",
    "Facebook",
    "Instagram",
    "Word of Mouth",
    "WhatsApp",
    "Google",
    "Unknown"
  ],

  // ----------------------------------------------------------
  //  CLEAN TYPES
  // ----------------------------------------------------------
  CLEAN_TYPES: [
    "Oven",
    "Carpets/Upholstery",
    "Deep Clean",
    "Pram/Car Seat",
    "Regular Clean",
    "AirBnB"
  ],

  // ----------------------------------------------------------
  //  MINIMUM CALLOUT CHARGE
  //  Applies to: Oven, Carpets/Upholstery, Pram/Car Seat
  // ----------------------------------------------------------
  MIN_CALLOUT: 75,

  // ----------------------------------------------------------
  //  OVEN CLEANING PRICING
  // ----------------------------------------------------------
  OVEN: {
    TYPES: [
      { id: "single",   label: "Single oven",    price: 75,  referToKieran: false },
      { id: "double",   label: "Double oven",    price: 95,  referToKieran: false },
      { id: "range",    label: "Standard range", price: 160, referToKieran: false },
      { id: "aga",      label: "AGA",            price: 0,   referToKieran: true  },
      { id: "combi",    label: "Combi",          price: 50,  referToKieran: false }
    ],
    HOB_ADDON: 15,        // Added once regardless of number of ovens
    EXTRACTOR_ADDON: 15   // Added once regardless of number of ovens
  },

  // ----------------------------------------------------------
  //  DEEP CLEANING PRICING
  // ----------------------------------------------------------
  DEEP_CLEAN: {
    DOMESTIC_RATE: 29,          // £/hr inc VAT
    COMMERCIAL_RATE: 25,        // £/hr + VAT (commercial residential managed only)

    // Hours estimate per bedroom count: [min, max]
    // Index 0 = 1 bed, index 1 = 2 bed, etc.
    HOURS_BY_BEDS: [
      [4, 6],   // 1 bed
      [6, 8],   // 2 bed
      [8, 10],  // 3 bed
      [10, 12], // 4 bed
      [12, 14]  // 5 bed
    ],
    EXTRA_BED_HOURS: 2  // Each bedroom beyond 5 adds this many hours
  },

  // ----------------------------------------------------------
  //  CARPET CLEANING PRICING
  // ----------------------------------------------------------
  CARPET: {
    // Pricing per number of rooms
    ROOM_PRICING: [
      { rooms: 1, price: 45 },
      { rooms: 2, price: 65 },
      { rooms: 3, price: 80 },
      { rooms: 4, price: 90 },
      { rooms: 5, price: 100 },
      { rooms: 6, price: 110 }
      // Beyond 6: add £10 per room (handled in code)
    ],
    EXTRA_ROOM_PRICE: 10,       // Per room beyond the table above

    HALL_STAIRS_LANDING: 60,    // Added if included
    STAIN_PROTECTION: 30,       // Per room
    LOADING_CHARGE: 15,         // Always added (landlords exempt)

    // Upholstery pricing
    SOFA_SEAT_PRICE: 30,        // Per seat
    ARMCHAIR_PRICE: 45,         // Per armchair
    FOOTSTOOL_PRICE: 10,        // Only if total seats < 3
    SOFA_STAIN_PROTECTION: 10,  // Per sofa seat
    ARMCHAIR_STAIN_PROTECTION: 15  // Per armchair
  },

  // ----------------------------------------------------------
  //  PRAM / CAR SEAT PRICING
  // ----------------------------------------------------------
  PRAM: {
    STANDARD_PRAM: 75,      // Standard pram
    EXTRA_COMPONENT: 10,    // Per extra component (e.g. bassinet)
    CAR_SEAT: 45            // Per car seat
  },

  // ----------------------------------------------------------
  //  QUOTE DISCLAIMER
  // ----------------------------------------------------------
  QUOTE_DISCLAIMER: "This quote is approximate and subject to change following a site visit or further information.",

  // ----------------------------------------------------------
  //  COLUMN ORDER IN GOOGLE SHEETS
  //  Do not change the order — it must match your sheet exactly
  // ----------------------------------------------------------
  SHEET_COLUMNS: ["Date", "Lead Source", "Clean Type", "Name", "Postcode", "Contact Number", "Email", "Status", "Chased Date", "Notes", "Quote"]

};

// Make available globally
if (typeof module !== "undefined") module.exports = CEC_CONFIG;
