import { PrismaClient, PriceType, PlaceStatus, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'outdoor-parks' },
      update: {},
      create: { nameEn: 'Outdoor Parks', nameZh: '户外公园', slug: 'outdoor-parks', icon: '🌲', order: 1 },
    }),
    prisma.category.upsert({
      where: { slug: 'indoor-play' },
      update: {},
      create: { nameEn: 'Indoor Play', nameZh: '室内游乐', slug: 'indoor-play', icon: '🎮', order: 2 },
    }),
    prisma.category.upsert({
      where: { slug: 'museums' },
      update: {},
      create: { nameEn: 'Museums', nameZh: '博物馆', slug: 'museums', icon: '🏛️', order: 3 },
    }),
    prisma.category.upsert({
      where: { slug: 'beaches' },
      update: {},
      create: { nameEn: 'Beaches', nameZh: '海滩', slug: 'beaches', icon: '🏖️', order: 4 },
    }),
    prisma.category.upsert({
      where: { slug: 'cafes' },
      update: {},
      create: { nameEn: 'Cafes', nameZh: '亲子餐厅', slug: 'cafes', icon: '☕', order: 5 },
    }),
  ]);

  // Places (Auckland venues)
  const places = await Promise.all([
    prisma.place.upsert({
      where: { slug: 'kelly-tarltons' },
      update: {},
      create: {
        nameEn: "Kelly Tarlton's Sea Life Aquarium",
        nameZh: '凯利塔顿水族馆',
        slug: 'kelly-tarltons',
        description: 'Underwater aquarium with penguins, sharks, and interactive marine exhibits. Perfect for kids of all ages.',
        address: '23 Tamaki Drive, Orakei, Auckland',
        lat: -36.8523,
        lng: 174.8304,
        region: 'Auckland',
        priceType: PriceType.HIGH,
        ageMin: 0,
        ageMax: 16,
        indoor: true,
        hasParking: true,
        hasToilet: true,
        hasFood: true,
        phone: '+64 9 531 5065',
        website: 'https://www.kellytarltons.co.nz',
        status: PlaceStatus.PUBLISHED,
        isFeatured: true,
        categoryId: categories[1].id,
      },
    }),
    prisma.place.upsert({
      where: { slug: 'auckland-zoo' },
      update: {},
      create: {
        nameEn: 'Auckland Zoo',
        nameZh: '奥克兰动物园',
        slug: 'auckland-zoo',
        description: "New Zealand's largest zoo with over 135 species and interactive experiences. Great family day out.",
        address: 'Motions Road, Western Springs, Auckland',
        lat: -36.8604,
        lng: 174.7138,
        region: 'Auckland',
        priceType: PriceType.MEDIUM,
        ageMin: 0,
        ageMax: 99,
        indoor: false,
        hasParking: true,
        hasToilet: true,
        hasFood: true,
        phone: '+64 9 360 3800',
        website: 'https://www.aucklandzoo.co.nz',
        status: PlaceStatus.PUBLISHED,
        isFeatured: true,
        categoryId: categories[0].id,
      },
    }),
    prisma.place.upsert({
      where: { slug: 'motat' },
      update: {},
      create: {
        nameEn: 'MOTAT - Museum of Transport and Technology',
        nameZh: '交通科技博物馆',
        slug: 'motat',
        description: "Interactive museum exploring NZ's transport and technology heritage. Tram rides and hands-on exhibits.",
        address: '805 Great North Road, Western Springs, Auckland',
        lat: -36.8625,
        lng: 174.7092,
        region: 'Auckland',
        priceType: PriceType.MEDIUM,
        ageMin: 3,
        ageMax: 16,
        indoor: true,
        hasParking: true,
        hasToilet: true,
        hasFood: true,
        phone: '+64 9 815 5800',
        website: 'https://www.motat.nz',
        status: PlaceStatus.PUBLISHED,
        isFeatured: true,
        categoryId: categories[2].id,
      },
    }),
    prisma.place.upsert({
      where: { slug: 'mission-bay-beach' },
      update: {},
      create: {
        nameEn: 'Mission Bay Beach',
        nameZh: '使命湾海滩',
        slug: 'mission-bay-beach',
        description: 'Popular family beach with playground, fountain, and waterfront cafes. Great for picnics and swimming.',
        address: 'Tamaki Drive, Mission Bay, Auckland',
        lat: -36.8495,
        lng: 174.8378,
        region: 'Auckland',
        priceType: PriceType.FREE,
        ageMin: 0,
        ageMax: 99,
        indoor: false,
        hasParking: true,
        hasToilet: true,
        hasFood: true,
        phone: '',
        website: '',
        status: PlaceStatus.PUBLISHED,
        isFeatured: false,
        categoryId: categories[3].id,
      },
    }),
    prisma.place.upsert({
      where: { slug: 'butterfly-creek' },
      update: {},
      create: {
        nameEn: 'Butterfly Creek',
        nameZh: '蝴蝶溪',
        slug: 'butterfly-creek',
        description: 'Tropical butterfly house with crocodiles, farm animals, and a train ride. Rainy day favorite.',
        address: '10 Tom Pearce Drive, Auckland Airport',
        lat: -36.9763,
        lng: 174.7867,
        region: 'Auckland',
        priceType: PriceType.MEDIUM,
        ageMin: 0,
        ageMax: 12,
        indoor: true,
        hasParking: true,
        hasToilet: true,
        hasFood: true,
        phone: '+64 9 275 8880',
        website: 'https://www.butterflycreek.co.nz',
        status: PlaceStatus.PUBLISHED,
        isFeatured: true,
        categoryId: categories[1].id,
      },
    }),
  ]);

  // Opening hours for places
  await Promise.all(
    places.map((place) =>
      prisma.openingHour.createMany({
        data: [
          { placeId: place.id, dayOfWeek: 0, openTime: '09:00', closeTime: '17:00', closed: false },
          { placeId: place.id, dayOfWeek: 1, openTime: '09:00', closeTime: '17:00', closed: false },
          { placeId: place.id, dayOfWeek: 2, openTime: '09:00', closeTime: '17:00', closed: false },
          { placeId: place.id, dayOfWeek: 3, openTime: '09:00', closeTime: '17:00', closed: false },
          { placeId: place.id, dayOfWeek: 4, openTime: '09:00', closeTime: '17:00', closed: false },
          { placeId: place.id, dayOfWeek: 5, openTime: '09:00', closeTime: '17:00', closed: false },
          { placeId: place.id, dayOfWeek: 6, openTime: '09:00', closeTime: '17:00', closed: false },
        ],
        skipDuplicates: true,
      })
    )
  );

  // Test user
  const hashedPassword = await bcrypt.hash('password123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@kidweekend.nz' },
    update: {},
    create: {
      email: 'admin@kidweekend.nz',
      password: hashedPassword,
      name: 'Admin User',
      role: Role.ADMIN,
      emailVerified: new Date(),
    },
  });

  console.log(`✅ Seeded: ${categories.length} categories, ${places.length} places, 1 user`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
