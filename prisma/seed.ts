import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ─── Helpers ────────────────────────────────────────────────────────────────────

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function daysFromNow(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

function hoursAgo(n: number): Date {
  const d = new Date();
  d.setHours(d.getHours() - n);
  return d;
}

function cents(dollars: number): number {
  return dollars * 100;
}

// Real Unsplash truck images mapped to each listing index
const TRUCK_IMAGES: Array<{ url: string; thumbnailUrl: string }> = [
  // 0 - 2019 Freightliner Cascadia (White)
  {
    url: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=1200&h=800&fit=crop',
    thumbnailUrl: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=400&h=300&fit=crop',
  },
  // 1 - 2021 Peterbilt 579 (Black)
  {
    url: 'https://images.unsplash.com/photo-1592838064575-70ed626d3a0e?w=1200&h=800&fit=crop',
    thumbnailUrl: 'https://images.unsplash.com/photo-1592838064575-70ed626d3a0e?w=400&h=300&fit=crop',
  },
  // 2 - 2017 Kenworth T680 (Red)
  {
    url: 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=1200&h=800&fit=crop',
    thumbnailUrl: 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=400&h=300&fit=crop',
  },
  // 3 - 2020 Volvo VNL 860 (Silver)
  {
    url: 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=1200&h=800&fit=crop',
    thumbnailUrl: 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=400&h=300&fit=crop',
  },
  // 4 - 2016 International LT (Blue)
  {
    url: 'https://images.unsplash.com/photo-1605705658744-45f0fe8f9663?w=1200&h=800&fit=crop',
    thumbnailUrl: 'https://images.unsplash.com/photo-1605705658744-45f0fe8f9663?w=400&h=300&fit=crop',
  },
  // 5 - 2018 Mack Anthem (Graphite)
  {
    url: 'https://images.unsplash.com/photo-1568992687947-868a62a9f521?w=1200&h=800&fit=crop',
    thumbnailUrl: 'https://images.unsplash.com/photo-1568992687947-868a62a9f521?w=400&h=300&fit=crop',
  },
  // 6 - 2022 Freightliner Cascadia (Pearl White, Featured)
  {
    url: 'https://images.unsplash.com/photo-1616432043562-3671ea2e5242?w=1200&h=800&fit=crop',
    thumbnailUrl: 'https://images.unsplash.com/photo-1616432043562-3671ea2e5242?w=400&h=300&fit=crop',
  },
  // 7 - 2015 Peterbilt 389 (Black Cherry, Classic)
  {
    url: 'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?w=1200&h=800&fit=crop',
    thumbnailUrl: 'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?w=400&h=300&fit=crop',
  },
  // 8 - 2020 Kenworth W990 (Viper Red, Show Truck)
  {
    url: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=1200&h=800&fit=crop',
    thumbnailUrl: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=400&h=300&fit=crop',
  },
  // 9 - 2017 Volvo VNL 670 (White)
  {
    url: 'https://images.unsplash.com/photo-1591768793355-74d04bb6608f?w=1200&h=800&fit=crop',
    thumbnailUrl: 'https://images.unsplash.com/photo-1591768793355-74d04bb6608f?w=400&h=300&fit=crop',
  },
  // 10 - 2023 Freightliner Cascadia (Midnight Blue)
  {
    url: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1200&h=800&fit=crop',
    thumbnailUrl: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=400&h=300&fit=crop',
  },
  // 11 - 2019 Peterbilt 567 Day Cab (Yellow)
  {
    url: 'https://images.unsplash.com/photo-1532635241-17e820acc59f?w=1200&h=800&fit=crop',
    thumbnailUrl: 'https://images.unsplash.com/photo-1532635241-17e820acc59f?w=400&h=300&fit=crop',
  },
];

const PHOTO_CATEGORIES = [
  'EXTERIOR_FRONT',
  'EXTERIOR_REAR',
  'EXTERIOR_DRIVER_SIDE',
  'EXTERIOR_PASSENGER_SIDE',
  'ENGINE_BAY',
  'FRAME_RAILS',
  'FIFTH_WHEEL',
  'CAB_INTERIOR',
  'DASHBOARD',
  'TIRES_FRONT',
  'TIRES_REAR',
  'DOT_STICKER',
  'DAMAGE_DOCUMENTATION',
] as const;

const CATEGORY_LABELS: Record<string, string> = {
  EXTERIOR_FRONT: 'Front',
  EXTERIOR_REAR: 'Rear',
  EXTERIOR_DRIVER_SIDE: 'Driver+Side',
  EXTERIOR_PASSENGER_SIDE: 'Pass+Side',
  ENGINE_BAY: 'Engine',
  FRAME_RAILS: 'Frame',
  FIFTH_WHEEL: '5th+Wheel',
  CAB_INTERIOR: 'Interior',
  DASHBOARD: 'Dashboard',
  TIRES_FRONT: 'Front+Tires',
  TIRES_REAR: 'Rear+Tires',
  DOT_STICKER: 'DOT+Sticker',
  DAMAGE_DOCUMENTATION: 'Damage+Docs',
};

// ─── Main Seed ──────────────────────────────────────────────────────────────────

async function main() {
  console.log('Seeding RigBid database...\n');

  // ── Delete existing data in FK-safe order ──────────────────────────────────
  console.log('Clearing existing data...');
  await prisma.transaction.deleteMany();
  await prisma.bid.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.watchlistItem.deleteMany();
  await prisma.inspection.deleteMany();
  await prisma.inspectionPartner.deleteMany();
  await prisma.maintenanceRecord.deleteMany();
  await prisma.listingPhoto.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.user.deleteMany();
  console.log('  All tables cleared.\n');

  // ── Users ──────────────────────────────────────────────────────────────────
  console.log('Creating users...');
  const passwordHash = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@rigbid.com',
      passwordHash,
      role: 'ADMIN',
      verificationStatus: 'UNVERIFIED',
      emailVerified: new Date(),
    },
  });
  console.log(`  Created admin: ${admin.email}`);

  const seller1 = await prisma.user.create({
    data: {
      name: "Mike's Trucking",
      email: 'mike@example.com',
      passwordHash,
      role: 'SELLER',
      verificationStatus: 'VERIFIED_OWNER_OPERATOR',
      bio: 'Owner-operator since 2005. Running Western routes.',
      emailVerified: new Date(),
    },
  });
  console.log(`  Created seller: ${seller1.email}`);

  const seller2 = await prisma.user.create({
    data: {
      name: 'Big Rig Sales',
      email: 'dealer@example.com',
      passwordHash,
      role: 'SELLER',
      verificationStatus: 'VERIFIED_DEALER',
      bio: 'Licensed dealer specializing in late-model Freightliners and Peterbilts.',
      emailVerified: new Date(),
    },
  });
  console.log(`  Created seller: ${seller2.email}`);

  const buyer1 = await prisma.user.create({
    data: {
      name: 'John Smith',
      email: 'john@example.com',
      passwordHash,
      role: 'BUYER',
      verificationStatus: 'UNVERIFIED',
      emailVerified: new Date(),
    },
  });
  console.log(`  Created buyer: ${buyer1.email}`);

  const buyer2 = await prisma.user.create({
    data: {
      name: 'Sarah Johnson',
      email: 'sarah@example.com',
      passwordHash,
      role: 'BUYER',
      verificationStatus: 'UNVERIFIED',
      emailVerified: new Date(),
    },
  });
  console.log(`  Created buyer: ${buyer2.email}\n`);

  // ── Listings ───────────────────────────────────────────────────────────────
  console.log('Creating listings...');

  const listingsData = [
    // 1 ─ 2019 Freightliner Cascadia (ACTIVE)
    {
      title: '2019 Freightliner Cascadia \u2014 450K Miles, Detroit DD15',
      slug: '2019-freightliner-cascadia-450k-miles-detroit-dd15',
      make: 'Freightliner',
      model: 'Cascadia',
      year: 2019,
      vin: '3AKJGLDR5KSKA1234',
      mileage: 450000,
      engineMake: 'Detroit',
      engineModel: 'DD15',
      engineHP: 455,
      transmissionType: 'AUTO' as const,
      transmissionModel: 'Detroit DT12 10-Speed',
      axleConfiguration: 'TANDEM' as const,
      suspensionType: 'Air Ride',
      wheelbase: '228"',
      sleeperType: 'RAISED_ROOF' as const,
      fifthWheelType: 'Sliding',
      fuelType: 'DIESEL' as const,
      emissionsStandard: 'EPA17_PLUS' as const,
      carbCompliant: true,
      driveTrain: 'SIX_BY_FOUR' as const,
      exteriorColor: 'White',
      interiorCondition: 'Good',
      tireCondition: '70% tread remaining',
      tireBrand: 'Michelin',
      tireSize: '295/75R22.5',
      brakeCondition: 'Good - 50% pad life',
      dpfStatus: 'Recently cleaned at 445K',
      egrStatus: 'Operational',
      description:
        'Well-maintained one-owner Cascadia that has been on a dedicated lane its whole life. All services performed at dealer per schedule. New DPF filter at 420K, fresh DOT inspection good through next year.',
      startingBid: cents(45000),
      hasReserve: true,
      reservePrice: cents(52000),
      status: 'ACTIVE' as const,
      auctionStartTime: daysAgo(3),
      auctionEndTime: daysFromNow(4),
      listingTier: 'STANDARD' as const,
      locationCity: 'Dallas',
      locationState: 'TX',
      locationZip: '75201',
      sellerId: seller1.id,
      currentHighBid: cents(48500),
      bidCount: 6,
      viewCount: 234,
      watchCount: 18,
      noDamage: true,
    },
    // 2 ─ 2021 Peterbilt 579 (ACTIVE)
    {
      title: '2021 Peterbilt 579 \u2014 280K Miles, PACCAR MX-13',
      slug: '2021-peterbilt-579-280k-miles-paccar-mx-13',
      make: 'Peterbilt',
      model: '579',
      year: 2021,
      vin: '1XPBD49X3MD567890',
      mileage: 280000,
      engineMake: 'PACCAR',
      engineModel: 'MX-13',
      engineHP: 510,
      transmissionType: 'AUTOMATED_MANUAL' as const,
      transmissionModel: 'Eaton Fuller Advantage 10-Speed',
      axleConfiguration: 'TANDEM' as const,
      suspensionType: 'Air Ride',
      wheelbase: '232"',
      sleeperType: 'RAISED_ROOF' as const,
      fifthWheelType: 'Sliding',
      fuelType: 'DIESEL' as const,
      emissionsStandard: 'EPA17_PLUS' as const,
      carbCompliant: true,
      driveTrain: 'SIX_BY_FOUR' as const,
      exteriorColor: 'Black',
      interiorCondition: 'Excellent',
      tireCondition: '85% tread remaining',
      tireBrand: 'Goodyear',
      tireSize: '295/75R22.5',
      brakeCondition: 'Excellent - 80% pad life',
      dpfStatus: 'Clean',
      egrStatus: 'Operational',
      description:
        'Low-mileage 579 coming off a fleet lease. Always serviced at Peterbilt dealers. Full platinum interior package with refrigerator and inverter. Clean title, no accidents.',
      startingBid: cents(75000),
      hasReserve: true,
      reservePrice: cents(82000),
      status: 'ACTIVE' as const,
      auctionStartTime: daysAgo(2),
      auctionEndTime: daysFromNow(5),
      listingTier: 'STANDARD' as const,
      locationCity: 'Atlanta',
      locationState: 'GA',
      locationZip: '30301',
      sellerId: seller2.id,
      currentHighBid: cents(78000),
      bidCount: 4,
      viewCount: 312,
      watchCount: 25,
      noDamage: true,
    },
    // 3 ─ 2017 Kenworth T680 (ACTIVE)
    {
      title: '2017 Kenworth T680 \u2014 620K Miles, Cummins X15',
      slug: '2017-kenworth-t680-620k-miles-cummins-x15',
      make: 'Kenworth',
      model: 'T680',
      year: 2017,
      vin: '1XKYD49X1HJ234567',
      mileage: 620000,
      engineMake: 'Cummins',
      engineModel: 'X15',
      engineHP: 450,
      transmissionType: 'MANUAL' as const,
      transmissionModel: 'Eaton Fuller 13-Speed',
      axleConfiguration: 'TANDEM' as const,
      suspensionType: 'Air Ride',
      wheelbase: '236"',
      sleeperType: 'RAISED_ROOF' as const,
      fifthWheelType: 'Sliding',
      fuelType: 'DIESEL' as const,
      emissionsStandard: 'EPA13' as const,
      carbCompliant: false,
      driveTrain: 'SIX_BY_FOUR' as const,
      exteriorColor: 'Red',
      interiorCondition: 'Fair',
      tireCondition: '50% tread remaining',
      tireBrand: 'Continental',
      tireSize: '295/75R22.5',
      brakeCondition: 'Good - recently relined',
      dpfStatus: 'Last cleaned at 600K',
      egrStatus: 'Delete kit installed (non-CARB states only)',
      description:
        'High-mileage T680 that runs strong. Cummins X15 was rebuilt at 500K miles with documentation. Great truck for an owner-operator looking for a manual trans. Not CARB compliant.',
      startingBid: cents(35000),
      hasReserve: false,
      reservePrice: null,
      status: 'ACTIVE' as const,
      auctionStartTime: daysAgo(5),
      auctionEndTime: daysFromNow(2),
      listingTier: 'STANDARD' as const,
      locationCity: 'Phoenix',
      locationState: 'AZ',
      locationZip: '85001',
      sellerId: seller1.id,
      currentHighBid: cents(38000),
      bidCount: 8,
      viewCount: 189,
      watchCount: 12,
      noDamage: false,
    },
    // 4 ─ 2020 Volvo VNL 860 (ACTIVE)
    {
      title: '2020 Volvo VNL 860 \u2014 380K Miles, Volvo D13, I-Shift',
      slug: '2020-volvo-vnl-860-380k-miles-volvo-d13-i-shift',
      make: 'Volvo',
      model: 'VNL 860',
      year: 2020,
      vin: '4V4NC9EH7LN345678',
      mileage: 380000,
      engineMake: 'Volvo',
      engineModel: 'D13',
      engineHP: 500,
      transmissionType: 'AUTO' as const,
      transmissionModel: 'Volvo I-Shift 12-Speed',
      axleConfiguration: 'TANDEM' as const,
      suspensionType: 'Volvo Air Ride',
      wheelbase: '244"',
      sleeperType: 'CONDO' as const,
      fifthWheelType: 'Sliding',
      fuelType: 'DIESEL' as const,
      emissionsStandard: 'EPA17_PLUS' as const,
      carbCompliant: true,
      driveTrain: 'SIX_BY_FOUR' as const,
      exteriorColor: 'Silver',
      interiorCondition: 'Excellent',
      tireCondition: '80% tread remaining',
      tireBrand: 'Bridgestone',
      tireSize: '295/75R22.5',
      brakeCondition: 'Excellent - 70% pad life',
      dpfStatus: 'Clean',
      egrStatus: 'Operational',
      description:
        'Full condo sleeper VNL 860 with all the options. Bunk heater, premium sound, dual bunks. This truck was a team truck and the interior shows it was well cared for. Serviced at Volvo dealers only.',
      startingBid: cents(68000),
      hasReserve: true,
      reservePrice: cents(74000),
      status: 'ACTIVE' as const,
      auctionStartTime: daysAgo(1),
      auctionEndTime: daysFromNow(6),
      listingTier: 'STANDARD' as const,
      locationCity: 'Chicago',
      locationState: 'IL',
      locationZip: '60601',
      sellerId: seller2.id,
      currentHighBid: cents(70000),
      bidCount: 3,
      viewCount: 275,
      watchCount: 22,
      noDamage: true,
    },
    // 5 ─ 2016 International LT (ACTIVE)
    {
      title: '2016 International LT \u2014 550K Miles, Cummins X15',
      slug: '2016-international-lt-550k-miles-cummins-x15',
      make: 'International',
      model: 'LT',
      year: 2016,
      vin: '3HSDJAPR0GN456789',
      mileage: 550000,
      engineMake: 'Cummins',
      engineModel: 'X15',
      engineHP: 400,
      transmissionType: 'AUTOMATED_MANUAL' as const,
      transmissionModel: 'Eaton Fuller Advantage',
      axleConfiguration: 'TANDEM' as const,
      suspensionType: 'Air Ride',
      wheelbase: '220"',
      sleeperType: 'MID_ROOF' as const,
      fifthWheelType: 'Fixed',
      fuelType: 'DIESEL' as const,
      emissionsStandard: 'EPA13' as const,
      carbCompliant: false,
      driveTrain: 'SIX_BY_FOUR' as const,
      exteriorColor: 'Blue',
      interiorCondition: 'Fair',
      tireCondition: '40% tread remaining',
      tireBrand: 'Firestone',
      tireSize: '295/75R22.5',
      brakeCondition: 'Fair - due for service at next PM',
      dpfStatus: 'Needs cleaning soon',
      egrStatus: 'Operational',
      description:
        'Budget-friendly International LT. Runs and drives well, gets good fuel mileage with the Cummins X15. Interior is driver-worn but functional. Brakes and tires will need attention within 30K miles.',
      startingBid: cents(28000),
      hasReserve: false,
      reservePrice: null,
      status: 'ACTIVE' as const,
      auctionStartTime: daysAgo(4),
      auctionEndTime: daysFromNow(3),
      listingTier: 'STANDARD' as const,
      locationCity: 'Sacramento',
      locationState: 'CA',
      locationZip: '95814',
      sellerId: seller1.id,
      currentHighBid: cents(30500),
      bidCount: 5,
      viewCount: 145,
      watchCount: 9,
      noDamage: false,
    },
    // 6 ─ 2018 Mack Anthem (ACTIVE)
    {
      title: '2018 Mack Anthem \u2014 490K Miles, Mack MP8',
      slug: '2018-mack-anthem-490k-miles-mack-mp8',
      make: 'Mack',
      model: 'Anthem',
      year: 2018,
      vin: '1M1AN4GY3JM567890',
      mileage: 490000,
      engineMake: 'Mack',
      engineModel: 'MP8',
      engineHP: 445,
      transmissionType: 'AUTOMATED_MANUAL' as const,
      transmissionModel: 'mDRIVE 12-Speed',
      axleConfiguration: 'TANDEM' as const,
      suspensionType: 'Mack Air Ride',
      wheelbase: '230"',
      sleeperType: 'RAISED_ROOF' as const,
      fifthWheelType: 'Sliding',
      fuelType: 'DIESEL' as const,
      emissionsStandard: 'EPA13' as const,
      carbCompliant: false,
      driveTrain: 'SIX_BY_FOUR' as const,
      exteriorColor: 'Graphite',
      interiorCondition: 'Good',
      tireCondition: '60% tread remaining',
      tireBrand: 'Yokohama',
      tireSize: '295/75R22.5',
      brakeCondition: 'Good - 55% pad life',
      dpfStatus: 'Cleaned at 475K',
      egrStatus: 'Operational',
      description:
        'Solid Mack Anthem with the bulletproof MP8 engine. This truck was used for regional hauls and has never been overloaded. mDRIVE transmission shifts smoothly. Great truck for heavy haul applications.',
      startingBid: cents(38000),
      hasReserve: true,
      reservePrice: cents(43000),
      status: 'ACTIVE' as const,
      auctionStartTime: daysAgo(2),
      auctionEndTime: daysFromNow(5),
      listingTier: 'STANDARD' as const,
      locationCity: 'Portland',
      locationState: 'OR',
      locationZip: '97201',
      sellerId: seller2.id,
      currentHighBid: cents(41000),
      bidCount: 5,
      viewCount: 198,
      watchCount: 14,
      noDamage: true,
    },
    // 7 ─ 2022 Freightliner Cascadia (ACTIVE, FEATURED)
    {
      title: '2022 Freightliner Cascadia \u2014 180K Miles, DD15, Like New',
      slug: '2022-freightliner-cascadia-180k-miles-dd15-like-new',
      make: 'Freightliner',
      model: 'Cascadia',
      year: 2022,
      vin: '3AKJGLDR7NSKA7890',
      mileage: 180000,
      engineMake: 'Detroit',
      engineModel: 'DD15',
      engineHP: 505,
      transmissionType: 'AUTO' as const,
      transmissionModel: 'Detroit DT12 12-Speed',
      axleConfiguration: 'TANDEM' as const,
      suspensionType: 'Air Ride',
      wheelbase: '230"',
      sleeperType: 'RAISED_ROOF' as const,
      fifthWheelType: 'Sliding',
      fuelType: 'DIESEL' as const,
      emissionsStandard: 'EPA17_PLUS' as const,
      carbCompliant: true,
      driveTrain: 'SIX_BY_FOUR' as const,
      exteriorColor: 'Pearl White',
      interiorCondition: 'Excellent',
      tireCondition: '90% tread remaining',
      tireBrand: 'Michelin',
      tireSize: '295/75R22.5',
      brakeCondition: 'Excellent - like new',
      dpfStatus: 'Clean - no regens needed yet',
      egrStatus: 'Operational',
      description:
        'Near-new 2022 Cascadia coming off a 2-year lease from a mega carrier. Only 180K miles and it shows. Full factory warranty remaining through 2025. Loaded with Detroit Assurance 5.0 safety suite.',
      startingBid: cents(89000),
      hasReserve: true,
      reservePrice: cents(98000),
      status: 'ACTIVE' as const,
      auctionStartTime: daysAgo(1),
      auctionEndTime: daysFromNow(6),
      listingTier: 'FEATURED' as const,
      locationCity: 'Nashville',
      locationState: 'TN',
      locationZip: '37201',
      sellerId: seller1.id,
      currentHighBid: cents(92000),
      bidCount: 7,
      viewCount: 567,
      watchCount: 45,
      noDamage: true,
    },
    // 8 ─ 2015 Peterbilt 389 (ACTIVE)
    {
      title: '2015 Peterbilt 389 \u2014 720K Miles, CAT C15 Rebuild, Flat Top',
      slug: '2015-peterbilt-389-720k-miles-cat-c15-rebuild-flat-top',
      make: 'Peterbilt',
      model: '389',
      year: 2015,
      vin: '1XPWD49X7FD678901',
      mileage: 720000,
      engineMake: 'Caterpillar',
      engineModel: 'C15 (Rebuilt)',
      engineHP: 475,
      transmissionType: 'MANUAL' as const,
      transmissionModel: 'Eaton Fuller 18-Speed',
      axleConfiguration: 'TANDEM' as const,
      suspensionType: 'Air Ride',
      wheelbase: '244"',
      sleeperType: 'FLAT_TOP' as const,
      fifthWheelType: 'Sliding',
      fuelType: 'DIESEL' as const,
      emissionsStandard: 'PRE_EPA07' as const,
      carbCompliant: false,
      driveTrain: 'SIX_BY_FOUR' as const,
      exteriorColor: 'Black Cherry',
      interiorCondition: 'Good',
      tireCondition: '55% tread remaining',
      tireBrand: 'Toyo',
      tireSize: '295/75R22.5',
      brakeCondition: 'Good - 60% pad life',
      dpfStatus: 'N/A - Pre-EPA07',
      egrStatus: 'N/A - Pre-EPA07',
      description:
        'Classic 389 with a freshly rebuilt CAT C15 at 680K miles. Full rebuild receipts available. 18-speed manual for the real truckers. This glider kit runs in non-CARB states. Chrome bumper and stacks.',
      startingBid: cents(42000),
      hasReserve: true,
      reservePrice: cents(48000),
      status: 'ACTIVE' as const,
      auctionStartTime: daysAgo(6),
      auctionEndTime: daysFromNow(1),
      listingTier: 'STANDARD' as const,
      locationCity: 'Oklahoma City',
      locationState: 'OK',
      locationZip: '73102',
      sellerId: seller2.id,
      currentHighBid: cents(46000),
      bidCount: 9,
      viewCount: 421,
      watchCount: 33,
      noDamage: true,
    },
    // 9 ─ 2020 Kenworth W990 (ENDED, FEATURED)
    {
      title: '2020 Kenworth W990 \u2014 310K Miles, PACCAR MX-13, Show Truck',
      slug: '2020-kenworth-w990-310k-miles-paccar-mx-13-show-truck',
      make: 'Kenworth',
      model: 'W990',
      year: 2020,
      vin: '1XKWD49X5LJ789012',
      mileage: 310000,
      engineMake: 'PACCAR',
      engineModel: 'MX-13',
      engineHP: 510,
      transmissionType: 'MANUAL' as const,
      transmissionModel: 'Eaton Fuller 18-Speed',
      axleConfiguration: 'TANDEM' as const,
      suspensionType: 'Air Ride',
      wheelbase: '240"',
      sleeperType: 'RAISED_ROOF' as const,
      fifthWheelType: 'Sliding',
      fuelType: 'DIESEL' as const,
      emissionsStandard: 'EPA17_PLUS' as const,
      carbCompliant: true,
      driveTrain: 'SIX_BY_FOUR' as const,
      exteriorColor: 'Viper Red',
      interiorCondition: 'Excellent',
      tireCondition: '75% tread remaining',
      tireBrand: 'Michelin',
      tireSize: '295/75R22.5',
      brakeCondition: 'Excellent - 75% pad life',
      dpfStatus: 'Clean',
      egrStatus: 'Operational',
      description:
        'Stunning W990 with full chrome package, custom paint, and polished aluminum wheels. This truck turns heads at every truck stop. Owner-operator spec with all the luxury options. Won Best of Show at GATS 2023.',
      startingBid: cents(95000),
      hasReserve: true,
      reservePrice: cents(105000),
      status: 'ENDED' as const,
      auctionStartTime: daysAgo(10),
      auctionEndTime: daysAgo(3),
      listingTier: 'FEATURED' as const,
      locationCity: 'Louisville',
      locationState: 'KY',
      locationZip: '40202',
      sellerId: seller1.id,
      currentHighBid: cents(102000),
      bidCount: 14,
      viewCount: 892,
      watchCount: 67,
      noDamage: true,
    },
    // 10 ─ 2017 Volvo VNL 670 (SOLD)
    {
      title: '2017 Volvo VNL 670 \u2014 580K Miles, Volvo D13, I-Shift',
      slug: '2017-volvo-vnl-670-580k-miles-volvo-d13-i-shift',
      make: 'Volvo',
      model: 'VNL 670',
      year: 2017,
      vin: '4V4NC9EH1HN890123',
      mileage: 580000,
      engineMake: 'Volvo',
      engineModel: 'D13',
      engineHP: 425,
      transmissionType: 'AUTO' as const,
      transmissionModel: 'Volvo I-Shift 12-Speed',
      axleConfiguration: 'TANDEM' as const,
      suspensionType: 'Volvo Air Ride',
      wheelbase: '224"',
      sleeperType: 'MID_ROOF' as const,
      fifthWheelType: 'Sliding',
      fuelType: 'DIESEL' as const,
      emissionsStandard: 'EPA13' as const,
      carbCompliant: false,
      driveTrain: 'SIX_BY_FOUR' as const,
      exteriorColor: 'White',
      interiorCondition: 'Good',
      tireCondition: '45% tread remaining',
      tireBrand: 'Continental',
      tireSize: '295/75R22.5',
      brakeCondition: 'Good - 50% pad life',
      dpfStatus: 'Last cleaned at 560K',
      egrStatus: 'Operational',
      description:
        'Reliable VNL 670 workhorse. I-Shift transmission with engine brake. Good fuel economy at 6.8 MPG average. New batteries and alternator at 570K. Ready to go to work.',
      startingBid: cents(32000),
      hasReserve: false,
      reservePrice: null,
      status: 'SOLD' as const,
      auctionStartTime: daysAgo(14),
      auctionEndTime: daysAgo(7),
      listingTier: 'STANDARD' as const,
      locationCity: 'Denver',
      locationState: 'CO',
      locationZip: '80202',
      sellerId: seller2.id,
      currentHighBid: cents(36500),
      bidCount: 11,
      viewCount: 378,
      watchCount: 19,
      noDamage: true,
    },
    // 11 ─ 2023 Freightliner Cascadia (SOLD)
    {
      title: '2023 Freightliner Cascadia \u2014 95K Miles, DD15, Factory Warranty',
      slug: '2023-freightliner-cascadia-95k-miles-dd15-factory-warranty',
      make: 'Freightliner',
      model: 'Cascadia',
      year: 2023,
      vin: '3AKJGLDR9PSKA2345',
      mileage: 95000,
      engineMake: 'Detroit',
      engineModel: 'DD15',
      engineHP: 505,
      transmissionType: 'AUTO' as const,
      transmissionModel: 'Detroit DT12 12-Speed',
      axleConfiguration: 'TANDEM' as const,
      suspensionType: 'Air Ride',
      wheelbase: '230"',
      sleeperType: 'RAISED_ROOF' as const,
      fifthWheelType: 'Sliding',
      fuelType: 'DIESEL' as const,
      emissionsStandard: 'EPA17_PLUS' as const,
      carbCompliant: true,
      driveTrain: 'SIX_BY_FOUR' as const,
      exteriorColor: 'Midnight Blue',
      interiorCondition: 'Like New',
      tireCondition: '95% tread remaining',
      tireBrand: 'Michelin',
      tireSize: '295/75R22.5',
      brakeCondition: 'Like new',
      dpfStatus: 'Factory fresh',
      egrStatus: 'Operational',
      description:
        'Practically new 2023 Cascadia with remaining factory bumper-to-bumper warranty. Owner upgrading to new model. Only 95K miles on the odometer. Detroit Assurance 5.0, adaptive cruise, and lane departure.',
      startingBid: cents(110000),
      hasReserve: true,
      reservePrice: cents(118000),
      status: 'SOLD' as const,
      auctionStartTime: daysAgo(12),
      auctionEndTime: daysAgo(5),
      listingTier: 'STANDARD' as const,
      locationCity: 'Charlotte',
      locationState: 'NC',
      locationZip: '28202',
      sellerId: seller1.id,
      currentHighBid: cents(119000),
      bidCount: 16,
      viewCount: 734,
      watchCount: 52,
      noDamage: true,
    },
    // 12 ─ 2019 Peterbilt 567 Day Cab (ENDED)
    {
      title: '2019 Peterbilt 567 Day Cab \u2014 340K Miles, PACCAR MX-13',
      slug: '2019-peterbilt-567-day-cab-340k-miles-paccar-mx-13',
      make: 'Peterbilt',
      model: '567',
      year: 2019,
      vin: '1XPCD49X6KD901234',
      mileage: 340000,
      engineMake: 'PACCAR',
      engineModel: 'MX-13',
      engineHP: 455,
      transmissionType: 'AUTOMATED_MANUAL' as const,
      transmissionModel: 'Eaton Fuller Advantage',
      axleConfiguration: 'TANDEM' as const,
      suspensionType: 'Air Ride',
      wheelbase: '185"',
      sleeperType: 'NONE' as const,
      fifthWheelType: 'Fixed',
      fuelType: 'DIESEL' as const,
      emissionsStandard: 'EPA17_PLUS' as const,
      carbCompliant: true,
      driveTrain: 'SIX_BY_FOUR' as const,
      exteriorColor: 'Yellow',
      interiorCondition: 'Good',
      tireCondition: '65% tread remaining',
      tireBrand: 'Goodyear',
      tireSize: '295/75R22.5',
      brakeCondition: 'Good - 55% pad life',
      dpfStatus: 'Cleaned at 320K',
      egrStatus: 'Operational',
      description:
        'Vocational-ready 567 day cab perfect for local and regional work. Set up for dump trailer or flatbed operation. PTO-ready with wet kit plumbing. Clean truck with good service history.',
      startingBid: cents(55000),
      hasReserve: false,
      reservePrice: null,
      status: 'ENDED' as const,
      auctionStartTime: daysAgo(9),
      auctionEndTime: daysAgo(2),
      listingTier: 'STANDARD' as const,
      locationCity: 'Houston',
      locationState: 'TX',
      locationZip: '77001',
      sellerId: seller2.id,
      currentHighBid: cents(58000),
      bidCount: 7,
      viewCount: 256,
      watchCount: 11,
      noDamage: true,
    },
  ];

  const listings: Array<{ id: string; title: string; sellerId: string; status: string; currentHighBid: number; bidCount: number }> = [];

  for (const data of listingsData) {
    const listing = await prisma.listing.create({ data });
    listings.push({
      id: listing.id,
      title: listing.title,
      sellerId: listing.sellerId,
      status: listing.status,
      currentHighBid: listing.currentHighBid,
      bidCount: listing.bidCount,
    });
    console.log(`  Created listing: ${listing.title}`);
  }
  console.log(`  ${listings.length} listings created.\n`);

  // ── Photos ─────────────────────────────────────────────────────────────────
  console.log('Creating listing photos...');
  let photoCount = 0;

  for (let i = 0; i < listings.length; i++) {
    const listing = listings[i];
    const shortName = listing.title.split(' \u2014')[0]; // e.g. "2019 Freightliner Cascadia"
    const truckImage = TRUCK_IMAGES[i];

    for (let j = 0; j < PHOTO_CATEGORIES.length; j++) {
      const cat = PHOTO_CATEGORIES[j];

      // Use the real truck image for the main exterior shots, same image with slight crop variations for others
      const isMainPhoto = j === 0; // EXTERIOR_FRONT is the hero image
      const cropOffset = j * 5; // Slight variation via crop positioning

      const url = isMainPhoto
        ? truckImage.url
        : `${truckImage.url.split('?')[0]}?w=1200&h=800&fit=crop&crop=entropy&q=80&fp-y=0.${50 + cropOffset}`;
      const thumbnailUrl = isMainPhoto
        ? truckImage.thumbnailUrl
        : `${truckImage.thumbnailUrl.split('?')[0]}?w=400&h=300&fit=crop&crop=entropy&q=80&fp-y=0.${50 + cropOffset}`;

      await prisma.listingPhoto.create({
        data: {
          listingId: listing.id,
          url,
          thumbnailUrl,
          category: cat,
          sortOrder: j,
          caption: `${shortName} - ${CATEGORY_LABELS[cat].replace(/\+/g, ' ')}`,
        },
      });
      photoCount++;
    }
  }
  console.log(`  ${photoCount} photos created.\n`);

  // ── Bids ───────────────────────────────────────────────────────────────────
  console.log('Creating bids...');
  let bidCount = 0;

  // Only create bids on ACTIVE listings
  const activeListings = listings.filter((l) => l.status === 'ACTIVE');

  // Define bid sequences for active listings (amounts in dollars)
  const bidSequences: Record<number, Array<{ bidderId: string; amount: number; hoursAgo: number }>> = {
    // Listing 0 (2019 Freightliner Cascadia) - 6 bids, high = $48,500
    0: [
      { bidderId: buyer1.id, amount: 45500, hoursAgo: 60 },
      { bidderId: buyer2.id, amount: 46000, hoursAgo: 55 },
      { bidderId: buyer1.id, amount: 46500, hoursAgo: 48 },
      { bidderId: buyer2.id, amount: 47000, hoursAgo: 36 },
      { bidderId: buyer1.id, amount: 48000, hoursAgo: 24 },
      { bidderId: buyer2.id, amount: 48500, hoursAgo: 12 },
    ],
    // Listing 1 (2021 Peterbilt 579) - 4 bids, high = $78,000
    1: [
      { bidderId: buyer2.id, amount: 75500, hoursAgo: 40 },
      { bidderId: buyer1.id, amount: 76000, hoursAgo: 32 },
      { bidderId: buyer2.id, amount: 77000, hoursAgo: 20 },
      { bidderId: buyer1.id, amount: 78000, hoursAgo: 10 },
    ],
    // Listing 2 (2017 Kenworth T680) - 8 bids, high = $38,000
    2: [
      { bidderId: buyer1.id, amount: 35500, hoursAgo: 100 },
      { bidderId: buyer2.id, amount: 35750, hoursAgo: 90 },
      { bidderId: buyer1.id, amount: 36000, hoursAgo: 80 },
      { bidderId: buyer2.id, amount: 36250, hoursAgo: 72 },
      { bidderId: buyer1.id, amount: 36500, hoursAgo: 60 },
      { bidderId: buyer2.id, amount: 37000, hoursAgo: 48 },
      { bidderId: buyer1.id, amount: 37500, hoursAgo: 30 },
      { bidderId: buyer2.id, amount: 38000, hoursAgo: 18 },
    ],
    // Listing 3 (2020 Volvo VNL 860) - 3 bids, high = $70,000
    3: [
      { bidderId: buyer1.id, amount: 68500, hoursAgo: 20 },
      { bidderId: buyer2.id, amount: 69000, hoursAgo: 14 },
      { bidderId: buyer1.id, amount: 70000, hoursAgo: 8 },
    ],
    // Listing 4 (2016 International LT) - 5 bids, high = $30,500
    4: [
      { bidderId: buyer2.id, amount: 28500, hoursAgo: 80 },
      { bidderId: buyer1.id, amount: 29000, hoursAgo: 65 },
      { bidderId: buyer2.id, amount: 29500, hoursAgo: 50 },
      { bidderId: buyer1.id, amount: 30000, hoursAgo: 35 },
      { bidderId: buyer2.id, amount: 30500, hoursAgo: 22 },
    ],
    // Listing 5 (2018 Mack Anthem) - 5 bids, high = $41,000
    5: [
      { bidderId: buyer1.id, amount: 38500, hoursAgo: 42 },
      { bidderId: buyer2.id, amount: 39000, hoursAgo: 36 },
      { bidderId: buyer1.id, amount: 39500, hoursAgo: 28 },
      { bidderId: buyer2.id, amount: 40000, hoursAgo: 20 },
      { bidderId: buyer1.id, amount: 41000, hoursAgo: 10 },
    ],
    // Listing 6 (2022 Freightliner Cascadia FEATURED) - 7 bids, high = $92,000
    6: [
      { bidderId: buyer2.id, amount: 89500, hoursAgo: 22 },
      { bidderId: buyer1.id, amount: 90000, hoursAgo: 20 },
      { bidderId: buyer2.id, amount: 90500, hoursAgo: 18 },
      { bidderId: buyer1.id, amount: 91000, hoursAgo: 15 },
      { bidderId: buyer2.id, amount: 91250, hoursAgo: 12 },
      { bidderId: buyer1.id, amount: 91500, hoursAgo: 8 },
      { bidderId: buyer2.id, amount: 92000, hoursAgo: 4 },
    ],
    // Listing 7 (2015 Peterbilt 389) - 9 bids, high = $46,000
    7: [
      { bidderId: buyer1.id, amount: 42500, hoursAgo: 130 },
      { bidderId: buyer2.id, amount: 43000, hoursAgo: 118 },
      { bidderId: buyer1.id, amount: 43500, hoursAgo: 100 },
      { bidderId: buyer2.id, amount: 44000, hoursAgo: 85 },
      { bidderId: buyer1.id, amount: 44250, hoursAgo: 70 },
      { bidderId: buyer2.id, amount: 44500, hoursAgo: 55 },
      { bidderId: buyer1.id, amount: 45000, hoursAgo: 40 },
      { bidderId: buyer2.id, amount: 45500, hoursAgo: 25 },
      { bidderId: buyer1.id, amount: 46000, hoursAgo: 10 },
    ],
  };

  for (let i = 0; i < activeListings.length; i++) {
    const listing = activeListings[i];
    const sequence = bidSequences[i];
    if (!sequence) continue;

    for (const bid of sequence) {
      await prisma.bid.create({
        data: {
          listingId: listing.id,
          bidderId: bid.bidderId,
          amount: cents(bid.amount),
          isAutoBid: false,
          createdAt: hoursAgo(bid.hoursAgo),
        },
      });
      bidCount++;
    }
  }

  // Also create some bids on the SOLD/ENDED listings for history
  // Listing 8 (W990, ENDED) - a few bids
  const endedSoldBids = [
    { listingIdx: 8, bidderId: buyer1.id, amount: 96000, hoursAgo: 200 },
    { listingIdx: 8, bidderId: buyer2.id, amount: 98000, hoursAgo: 180 },
    { listingIdx: 8, bidderId: buyer1.id, amount: 100000, hoursAgo: 150 },
    { listingIdx: 8, bidderId: buyer2.id, amount: 102000, hoursAgo: 80 },
    // Listing 9 (VNL 670, SOLD) - bids
    { listingIdx: 9, bidderId: buyer2.id, amount: 33000, hoursAgo: 300 },
    { listingIdx: 9, bidderId: buyer1.id, amount: 34000, hoursAgo: 270 },
    { listingIdx: 9, bidderId: buyer2.id, amount: 35000, hoursAgo: 240 },
    { listingIdx: 9, bidderId: buyer1.id, amount: 36000, hoursAgo: 200 },
    { listingIdx: 9, bidderId: buyer2.id, amount: 36500, hoursAgo: 170 },
    // Listing 10 (2023 Cascadia, SOLD)
    { listingIdx: 10, bidderId: buyer1.id, amount: 111000, hoursAgo: 260 },
    { listingIdx: 10, bidderId: buyer2.id, amount: 113000, hoursAgo: 230 },
    { listingIdx: 10, bidderId: buyer1.id, amount: 115000, hoursAgo: 200 },
    { listingIdx: 10, bidderId: buyer2.id, amount: 117000, hoursAgo: 160 },
    { listingIdx: 10, bidderId: buyer1.id, amount: 119000, hoursAgo: 130 },
    // Listing 11 (567 Day Cab, ENDED)
    { listingIdx: 11, bidderId: buyer1.id, amount: 55500, hoursAgo: 190 },
    { listingIdx: 11, bidderId: buyer2.id, amount: 56000, hoursAgo: 170 },
    { listingIdx: 11, bidderId: buyer1.id, amount: 57000, hoursAgo: 140 },
    { listingIdx: 11, bidderId: buyer2.id, amount: 58000, hoursAgo: 100 },
  ];

  for (const bid of endedSoldBids) {
    await prisma.bid.create({
      data: {
        listingId: listings[bid.listingIdx].id,
        bidderId: bid.bidderId,
        amount: cents(bid.amount),
        isAutoBid: false,
        createdAt: hoursAgo(bid.hoursAgo),
      },
    });
    bidCount++;
  }

  console.log(`  ${bidCount} bids created.\n`);

  // ── Transactions for SOLD listings ─────────────────────────────────────────
  console.log('Creating transactions for sold listings...');

  // Listing 9 (VNL 670) - SOLD to buyer2
  const salePrice9 = cents(36500);
  const premium9 = Math.min(Math.round(salePrice9 * 0.05), cents(5000));
  await prisma.transaction.create({
    data: {
      listingId: listings[9].id,
      buyerId: buyer2.id,
      sellerId: listings[9].sellerId,
      salePrice: salePrice9,
      buyerPremiumAmount: premium9,
      totalAmount: salePrice9 + premium9,
      status: 'COMPLETED',
    },
  });
  console.log('  Created transaction for VNL 670 (COMPLETED)');

  // Listing 10 (2023 Cascadia) - SOLD to buyer1
  const salePrice10 = cents(119000);
  const premium10 = Math.min(Math.round(salePrice10 * 0.05), cents(5000));
  await prisma.transaction.create({
    data: {
      listingId: listings[10].id,
      buyerId: buyer1.id,
      sellerId: listings[10].sellerId,
      salePrice: salePrice10,
      buyerPremiumAmount: premium10,
      totalAmount: salePrice10 + premium10,
      status: 'PAID',
    },
  });
  console.log('  Created transaction for 2023 Cascadia (PAID)\n');

  // ── Comments ───────────────────────────────────────────────────────────────
  console.log('Creating comments...');

  // Comment on listing 0 (2019 Freightliner Cascadia)
  const comment1 = await prisma.comment.create({
    data: {
      listingId: listings[0].id,
      userId: buyer1.id,
      body: 'Has this truck ever had any aftertreatment issues? Curious about the DPF regen frequency on the DD15.',
      isSellerResponse: false,
    },
  });
  console.log('  Created buyer question on Freightliner Cascadia');

  // Seller reply (threaded)
  await prisma.comment.create({
    data: {
      listingId: listings[0].id,
      userId: seller1.id,
      parentId: comment1.id,
      body: 'No aftertreatment issues at all. The DPF was professionally cleaned at 420K miles and the regen cycles have been normal since. I have the shop receipts available if you want to see them.',
      isSellerResponse: true,
    },
  });
  console.log('  Created seller reply (threaded)');

  // Comment on listing 1 (2021 Peterbilt 579)
  await prisma.comment.create({
    data: {
      listingId: listings[1].id,
      userId: buyer2.id,
      body: 'What size inverter does it have? And is the APU still under warranty?',
      isSellerResponse: false,
    },
  });
  console.log('  Created buyer question on Peterbilt 579');

  // Seller response on listing 1
  await prisma.comment.create({
    data: {
      listingId: listings[1].id,
      userId: seller2.id,
      body: 'It has a 2000W pure sine wave inverter. The APU is a Thermo King TriPac Evolution and it does still have about 8 months of warranty remaining.',
      isSellerResponse: true,
    },
  });
  console.log('  Created seller response on Peterbilt 579');

  // Comment on listing 6 (2022 Cascadia FEATURED)
  await prisma.comment.create({
    data: {
      listingId: listings[6].id,
      userId: buyer1.id,
      body: 'Can you share the ECM report? I want to see the idle time percentage and any fault codes.',
      isSellerResponse: false,
    },
  });
  console.log('  Created buyer question on 2022 Cascadia');

  // Comment on listing 7 (2015 Peterbilt 389)
  await prisma.comment.create({
    data: {
      listingId: listings[7].id,
      userId: buyer2.id,
      body: 'Beautiful truck! Who did the C15 rebuild? And what components were replaced?',
      isSellerResponse: false,
    },
  });
  console.log('  Created buyer question on Peterbilt 389');

  await prisma.comment.create({
    data: {
      listingId: listings[7].id,
      userId: seller2.id,
      body: 'The rebuild was done by Southern Diesel in Birmingham, AL. Full in-frame with new pistons, liners, bearings, injectors, water pump, and oil pump. I can send the full invoice if you are serious about bidding.',
      isSellerResponse: true,
    },
  });
  console.log('  Created seller response on Peterbilt 389');

  // Comment on listing 2 (2017 Kenworth T680)
  await prisma.comment.create({
    data: {
      listingId: listings[2].id,
      userId: buyer1.id,
      body: 'Is this truck eligible for financing or is it cash only? Also, can you do a pre-purchase inspection?',
      isSellerResponse: false,
    },
  });
  console.log('  Created buyer question on Kenworth T680\n');

  // ── Maintenance Records ────────────────────────────────────────────────────
  console.log('Creating maintenance records...');
  let maintenanceCount = 0;

  const maintenanceData: Array<{
    listingIdx: number;
    records: Array<{
      type: string;
      description: string;
      mileageAtService: number;
      datePerformed: Date;
      shopName: string;
    }>;
  }> = [
    // Listing 0 - 2019 Freightliner Cascadia (450K)
    {
      listingIdx: 0,
      records: [
        {
          type: 'OIL_CHANGE',
          description: 'Full synthetic oil change with Delo 400 XLE 10W-30. Replaced oil filter and fuel filters.',
          mileageAtService: 435000,
          datePerformed: daysAgo(45),
          shopName: 'TA Truck Service - Dallas',
        },
        {
          type: 'DPF_CLEAN_REGEN',
          description: 'Professional DPF cleaning and forced regeneration. System tested and passed. No fault codes.',
          mileageAtService: 420000,
          datePerformed: daysAgo(90),
          shopName: 'Freightliner of Dallas',
        },
        {
          type: 'TIRE_REPLACEMENT',
          description: 'Replaced 4 drive tires with Michelin XDS2. Aligned steer axle.',
          mileageAtService: 410000,
          datePerformed: daysAgo(120),
          shopName: 'Discount Tire Commercial - Fort Worth',
        },
      ],
    },
    // Listing 1 - 2021 Peterbilt 579 (280K)
    {
      listingIdx: 1,
      records: [
        {
          type: 'OIL_CHANGE',
          description: 'Scheduled oil change with PACCAR genuine filters. Oil analysis sent to lab - results normal.',
          mileageAtService: 270000,
          datePerformed: daysAgo(30),
          shopName: 'Rush Peterbilt - Atlanta',
        },
        {
          type: 'BRAKE_SERVICE',
          description: 'Front brake adjustment and inspection. All measurements within spec. Rear brakes at 80%.',
          mileageAtService: 260000,
          datePerformed: daysAgo(60),
          shopName: 'Rush Peterbilt - Atlanta',
        },
      ],
    },
    // Listing 2 - 2017 Kenworth T680 (620K)
    {
      listingIdx: 2,
      records: [
        {
          type: 'OIL_CHANGE',
          description: 'Oil change with Valvoline Premium Blue 15W-40. Replaced both fuel filters and air filter.',
          mileageAtService: 610000,
          datePerformed: daysAgo(25),
          shopName: 'Inland Kenworth - Phoenix',
        },
        {
          type: 'DPF_CLEAN_REGEN',
          description: 'DPF cleaning and DOC inspection. Some soot buildup but within normal range for mileage.',
          mileageAtService: 600000,
          datePerformed: daysAgo(75),
          shopName: 'Cummins Southwest - Tucson',
        },
        {
          type: 'CLUTCH_REPLACEMENT',
          description: 'Replaced clutch assembly (Eaton). New flywheel resurfaced. Release bearing replaced.',
          mileageAtService: 520000,
          datePerformed: daysAgo(200),
          shopName: 'Big Rig Repair - Mesa, AZ',
        },
      ],
    },
    // Listing 3 - 2020 Volvo VNL 860 (380K)
    {
      listingIdx: 3,
      records: [
        {
          type: 'OIL_CHANGE',
          description: 'Volvo genuine oil and filter change. Performed at dealer per maintenance contract.',
          mileageAtService: 370000,
          datePerformed: daysAgo(20),
          shopName: 'Volvo Trucks of Chicago',
        },
        {
          type: 'COOLANT_SERVICE',
          description: 'Complete coolant flush and refill with Volvo VCS coolant. Thermostat tested OK.',
          mileageAtService: 350000,
          datePerformed: daysAgo(80),
          shopName: 'Volvo Trucks of Chicago',
        },
        {
          type: 'TRANSMISSION_SERVICE',
          description: 'I-Shift transmission oil change with Volvo spec fluid. Software updated to latest version.',
          mileageAtService: 340000,
          datePerformed: daysAgo(110),
          shopName: 'Volvo Trucks of Chicago',
        },
      ],
    },
    // Listing 4 - 2016 International LT (550K)
    {
      listingIdx: 4,
      records: [
        {
          type: 'OIL_CHANGE',
          description: 'Standard PM service. Oil, fuel filters, and air filter replaced.',
          mileageAtService: 540000,
          datePerformed: daysAgo(35),
          shopName: 'TravelCenters Truck Service - Sacramento',
        },
        {
          type: 'EGR_SERVICE',
          description: 'EGR valve cleaned and EGR cooler inspected. Some carbon buildup cleaned. Retest passed.',
          mileageAtService: 520000,
          datePerformed: daysAgo(100),
          shopName: 'Cummins Pacific - Sacramento',
        },
      ],
    },
    // Listing 5 - 2018 Mack Anthem (490K)
    {
      listingIdx: 5,
      records: [
        {
          type: 'OIL_CHANGE',
          description: 'Full synthetic oil change with Mack approved lubricant. Filters replaced.',
          mileageAtService: 480000,
          datePerformed: daysAgo(28),
          shopName: 'Mack Trucks Portland',
        },
        {
          type: 'DPF_CLEAN_REGEN',
          description: 'Scheduled DPF cleaning. DOC catalyst in good condition. Regen cycle normal.',
          mileageAtService: 475000,
          datePerformed: daysAgo(50),
          shopName: 'Mack Trucks Portland',
        },
        {
          type: 'BRAKE_SERVICE',
          description: 'Full brake inspection. Adjusted all brakes. Front pads at 55%, rear at 60%. All within spec.',
          mileageAtService: 460000,
          datePerformed: daysAgo(95),
          shopName: 'Oregon Truck Repair - Troutdale',
        },
      ],
    },
    // Listing 6 - 2022 Freightliner Cascadia (180K)
    {
      listingIdx: 6,
      records: [
        {
          type: 'OIL_CHANGE',
          description: 'Dealer PM service. Full synthetic oil and genuine Detroit filters.',
          mileageAtService: 170000,
          datePerformed: daysAgo(15),
          shopName: 'Freightliner of Nashville',
        },
        {
          type: 'OIL_ANALYSIS',
          description: 'Oil sample sent to Polaris Labs. All wear metals within normal limits. No coolant or fuel dilution detected.',
          mileageAtService: 170000,
          datePerformed: daysAgo(15),
          shopName: 'Polaris Laboratories',
        },
      ],
    },
    // Listing 7 - 2015 Peterbilt 389 (720K)
    {
      listingIdx: 7,
      records: [
        {
          type: 'OIL_CHANGE',
          description: 'Oil change with Rotella T6 5W-40 full synthetic. New Baldwin filters.',
          mileageAtService: 710000,
          datePerformed: daysAgo(20),
          shopName: 'Southern Diesel - Birmingham, AL',
        },
        {
          type: 'INJECTOR_REPLACEMENT',
          description: 'All 6 injectors replaced as part of engine rebuild. New CAT reman injectors installed.',
          mileageAtService: 680000,
          datePerformed: daysAgo(150),
          shopName: 'Southern Diesel - Birmingham, AL',
        },
        {
          type: 'TIRE_REPLACEMENT',
          description: 'Replaced 2 steer tires with Toyo M144. Hunter road force balanced.',
          mileageAtService: 700000,
          datePerformed: daysAgo(60),
          shopName: 'Oklahoma Tire - OKC',
        },
      ],
    },
    // Listing 8 - 2020 Kenworth W990 (310K)
    {
      listingIdx: 8,
      records: [
        {
          type: 'OIL_CHANGE',
          description: 'Premium oil service with PACCAR genuine filters and Chevron Delo 600 ADF.',
          mileageAtService: 300000,
          datePerformed: daysAgo(40),
          shopName: 'MHC Kenworth - Louisville',
        },
        {
          type: 'TRANSMISSION_SERVICE',
          description: '18-speed transmission fluid change. Inspected clutch - still in good condition.',
          mileageAtService: 290000,
          datePerformed: daysAgo(70),
          shopName: 'MHC Kenworth - Louisville',
        },
      ],
    },
    // Listing 9 - 2017 Volvo VNL 670 (580K)
    {
      listingIdx: 9,
      records: [
        {
          type: 'OIL_CHANGE',
          description: 'Standard PM service at 570K. Oil, fuel, and air filters replaced.',
          mileageAtService: 570000,
          datePerformed: daysAgo(50),
          shopName: 'Volvo Trucks of Denver',
        },
        {
          type: 'DPF_CLEAN_REGEN',
          description: 'DPF removed and ultrasonically cleaned. Reinstalled with new gaskets. Forced regen successful.',
          mileageAtService: 560000,
          datePerformed: daysAgo(85),
          shopName: 'Volvo Trucks of Denver',
        },
        {
          type: 'BRAKE_SERVICE',
          description: 'Replaced front brake shoes and drums. Rear brakes adjusted.',
          mileageAtService: 540000,
          datePerformed: daysAgo(130),
          shopName: 'Colorado Truck Repair - Commerce City',
        },
      ],
    },
    // Listing 10 - 2023 Freightliner Cascadia (95K)
    {
      listingIdx: 10,
      records: [
        {
          type: 'OIL_CHANGE',
          description: 'First scheduled PM service at dealer. Everything checked out perfect. Under warranty.',
          mileageAtService: 90000,
          datePerformed: daysAgo(30),
          shopName: 'Freightliner of Charlotte',
        },
        {
          type: 'ECM_REPORT',
          description: 'Detroit Connect Virtual Technician report pulled. No active or pending fault codes. 23% idle time.',
          mileageAtService: 90000,
          datePerformed: daysAgo(30),
          shopName: 'Freightliner of Charlotte',
        },
      ],
    },
    // Listing 11 - 2019 Peterbilt 567 (340K)
    {
      listingIdx: 11,
      records: [
        {
          type: 'OIL_CHANGE',
          description: 'PM service with PACCAR genuine parts. All fluid levels checked and topped off.',
          mileageAtService: 330000,
          datePerformed: daysAgo(35),
          shopName: 'Rush Peterbilt - Houston',
        },
        {
          type: 'DPF_CLEAN_REGEN',
          description: 'DPF cleaning performed. DOC and SCR catalysts inspected and tested. System operating normally.',
          mileageAtService: 320000,
          datePerformed: daysAgo(65),
          shopName: 'Rush Peterbilt - Houston',
        },
        {
          type: 'TURBO_SERVICE',
          description: 'Turbo inspected for shaft play - within spec. Intake boots replaced (preventative).',
          mileageAtService: 310000,
          datePerformed: daysAgo(95),
          shopName: 'Gulf Coast Diesel - Pasadena, TX',
        },
      ],
    },
  ];

  for (const { listingIdx, records } of maintenanceData) {
    for (const record of records) {
      await prisma.maintenanceRecord.create({
        data: {
          listingId: listings[listingIdx].id,
          type: record.type as any,
          description: record.description,
          mileageAtService: record.mileageAtService,
          datePerformed: record.datePerformed,
          shopName: record.shopName,
        },
      });
      maintenanceCount++;
    }
  }
  console.log(`  ${maintenanceCount} maintenance records created.\n`);

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log('========================================');
  console.log('  Seeding complete!');
  console.log('========================================');
  console.log(`  Users:              5`);
  console.log(`  Listings:           ${listings.length}`);
  console.log(`  Photos:             ${photoCount}`);
  console.log(`  Bids:               ${bidCount}`);
  console.log(`  Comments:           8`);
  console.log(`  Maintenance:        ${maintenanceCount}`);
  console.log(`  Transactions:       2`);
  console.log('========================================\n');
  console.log('Default login credentials:');
  console.log('  Admin:   admin@rigbid.com    / password123');
  console.log('  Seller:  mike@example.com    / password123');
  console.log('  Seller:  dealer@example.com  / password123');
  console.log('  Buyer:   john@example.com    / password123');
  console.log('  Buyer:   sarah@example.com   / password123');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
