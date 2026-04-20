-- ============================================================
-- KidWeekend NZ 测试数据
-- ============================================================

-- 清理现有数据（如果需要重置）
-- TRUNCATE TABLE place_images, opening_hours, reviews, favorites, places, categories, users CASCADE;

-- ============================================================
-- 1. 用户
-- ============================================================
INSERT INTO users (id, email, name, role, "emailVerified", "createdAt", "updatedAt") VALUES
  ('usr_001', 'admin@kidweekend.nz', 'Admin User', 'ADMIN', NOW(), NOW(), NOW()),
  ('usr_002', 'editor@kidweekend.nz', 'Editor User', 'EDITOR', NOW(), NOW(), NOW()),
  ('usr_003', 'user1@example.com', 'John Smith', 'USER', NOW(), NOW(), NOW()),
  ('usr_004', 'user2@example.com', '李明', 'USER', NOW(), NOW(), NOW());

-- ============================================================
-- 2. 分类
-- ============================================================
INSERT INTO categories (id, "nameEn", "nameZh", slug, icon, "order") VALUES
  ('cat_001', 'Playgrounds', '游乐场', 'playgrounds', '🏃', 1),
  ('cat_002', 'Museums', '博物馆', 'museums', '🏛️', 2),
  ('cat_003', 'Parks & Gardens', '公园花园', 'parks-gardens', '🌳', 3),
  ('cat_004', 'Indoor Play', '室内游乐', 'indoor-play', '🏠', 4),
  ('cat_005', 'Beaches', '海滩', 'beaches', '🏖️', 5),
  ('cat_006', 'Zoos & Aquariums', '动物园水族馆', 'zoos-aquariums', '🦁', 6),
  ('cat_007', 'Adventure Parks', '冒险乐园', 'adventure-parks', '🎢', 7),
  ('cat_008', 'Libraries', '图书馆', 'libraries', '📚', 8);

-- ============================================================
-- 3. 场所
-- ============================================================
INSERT INTO places (id, slug, "nameEn", "nameZh", description, address, lat, lng, region, "priceType", indoor, "hasParking", "hasFood", "hasToilet", "ageMin", "ageMax", "avgRating", "reviewCount", status, "isFeatured", "categoryId", "createdAt", "updatedAt") VALUES
  -- 奥克兰
  ('place_001', 'auckland-domain-playground', 'Auckland Domain Playground', '奥克兰领域公园游乐场',
   'Large playground with climbing structures, swings, and a flying fox. Great views of the city.',
   'Auckland Domain, Park Road, Grafton, Auckland',
   -36.8603, 174.7692, 'Auckland', 'FREE', false, true, false, true, 2, 12, 4.5, 28, 'PUBLISHED', true, 'cat_001', NOW(), NOW()),

  ('place_002', 'auckland-war-memorial-museum', 'Auckland War Memorial Museum', '奥克兰战争纪念博物馆',
   'Interactive exhibits for kids including the Discovery Centre. Māori and Pacific collections.',
   'The Auckland Domain, Parnell, Auckland',
   -36.8607, 174.7766, 'Auckland', 'MEDIUM', true, true, true, true, 3, 14, 4.7, 156, 'PUBLISHED', true, 'cat_002', NOW(), NOW()),

  ('place_003', 'rainbows-end', 'Rainbow''s End', '彩虹乐园',
   'New Zealand''s premier theme park with rides for all ages. Kidz Kingdom for under 8s.',
   '2 Clist Crescent, Manukau, Auckland',
   -36.9935, 174.8802, 'Auckland', 'HIGH', false, true, true, true, 2, 16, 4.3, 342, 'PUBLISHED', true, 'cat_007', NOW(), NOW()),

  ('place_004', 'kelly-tarltons-sea-life-aquarium', 'Kelly Tarlton''s Sea Life Aquarium', '凯利塔顿海洋生物水族馆',
   'Underwater tunnel, penguin encounter, and interactive rock pool. Great for rainy days.',
   '23 Tamaki Drive, Orakei, Auckland',
   -36.8468, 174.8278, 'Auckland', 'MEDIUM', true, true, false, true, 1, 14, 4.4, 198, 'PUBLISHED', true, 'cat_006', NOW(), NOW()),

  ('place_005', 'western-springs-park', 'Western Springs Park', '西泉公园',
   'Beautiful lakeside park with walking trails, playground, and bird watching. Free to visit.',
   'Western Springs, Auckland',
   -36.8796, 174.7213, 'Auckland', 'FREE', false, true, false, false, 0, 99, 4.2, 45, 'PUBLISHED', false, 'cat_003', NOW(), NOW()),

  ('place_006', 'tiptop-indoor-playground', 'TipTop Indoor Playground', 'TipTop室内游乐场',
   'Air-conditioned indoor playground with trampolines, ball pits, and climbing walls.',
   '120 Queen Street, Auckland CBD',
   -36.8485, 174.7635, 'Auckland', 'LOW', true, false, true, true, 1, 10, 4.1, 67, 'PUBLISHED', false, 'cat_004', NOW(), NOW()),

  -- 惠灵顿
  ('place_007', 'te-papa-museum', 'Te Papa Tongarewa', '新西兰国家博物馆',
   'National museum with interactive exhibits, Discovery Centres, and Māori cultural displays.',
   '55 Cable Street, Wellington',
   -41.2902, 174.7817, 'Wellington', 'FREE', true, false, true, true, 0, 99, 4.8, 412, 'PUBLISHED', true, 'cat_002', NOW(), NOW()),

  ('place_008', 'zealandia', 'Zealandia Ecosanctuary', '西兰尼亚生态保护区',
   'Predator-free sanctuary with native birds, tuatara, and walking trails. Night tours available.',
   '53 Waiapu Road, Karori, Wellington',
   -41.2937, 174.7318, 'Wellington', 'MEDIUM', false, true, false, true, 4, 99, 4.6, 178, 'PUBLISHED', true, 'cat_003', NOW(), NOW()),

  ('place_009', 'wellington-botanic-garden', 'Wellington Botanic Garden', '惠灵顿植物园',
   'Beautiful gardens with playground, duck pond, and cable car access. Free entry.',
   '101 Glenmore Street, Wellington',
   -41.2833, 174.7444, 'Wellington', 'FREE', false, true, false, true, 0, 99, 4.5, 89, 'PUBLISHED', false, 'cat_003', NOW(), NOW()),

  ('place_010', 'space-place', 'Space Place at Carter Observatory', '卡特天文馆太空馆',
   'Planetarium shows, interactive exhibits about space and astronomy. Great for curious kids.',
   '40 Salamanca Road, Kelburn, Wellington',
   -41.2828, 174.7583, 'Wellington', 'LOW', true, false, false, true, 5, 14, 4.3, 56, 'PUBLISHED', false, 'cat_002', NOW(), NOW()),

  -- 基督城
  ('place_011', 'christchurch-botanic-gardens', 'Christchurch Botanic Gardens', '基督城植物园',
   'Extensive gardens with playground, river punting, and visitor centre. Free entry.',
   'Rolleston Avenue, Christchurch',
   -43.5310, 172.6200, 'Christchurch', 'FREE', false, true, true, true, 0, 99, 4.6, 134, 'PUBLISHED', true, 'cat_003', NOW(), NOW()),

  ('place_012', 'orana-wildlife-park', 'Orana Wildlife Park', '奥拉纳野生动物园',
   'Open-range zoo with lions, rhinos, and native species. Feeding experiences available.',
   '738 McLeans Island Road, Christchurch',
   -43.5023, 172.4739, 'Christchurch', 'MEDIUM', false, true, true, true, 2, 99, 4.4, 167, 'PUBLISHED', true, 'cat_006', NOW(), NOW()),

  ('place_013', 'margaret-mahy-playground', 'Margaret Mahy Family Playground', '玛格丽特·马希家庭游乐场',
   'Award-winning playground with splash pad, flying fox, and accessible equipment.',
   '111 Manchester Street, Christchurch',
   -43.5291, 172.6411, 'Christchurch', 'FREE', false, true, true, true, 0, 14, 4.7, 289, 'PUBLISHED', true, 'cat_001', NOW(), NOW()),

  ('place_014', 'international-antarctic-centre', 'International Antarctic Centre', '国际南极中心',
   'Antarctic experience with penguins, Hagglund ride, and snow storm simulation.',
   '38 Orchard Road, Christchurch Airport',
   -43.4868, 172.5399, 'Christchurch', 'HIGH', true, true, true, true, 3, 99, 4.2, 145, 'PUBLISHED', false, 'cat_002', NOW(), NOW()),

  -- 但尼丁
  ('place_015', 'larnach-castle', 'Larnach Castle Gardens', '拉纳克城堡花园',
   'Historic castle with beautiful gardens and stunning views. Family-friendly events.',
   '145 Camp Road, Dunedin',
   -45.8785, 170.5286, 'Dunedin', 'MEDIUM', false, true, true, true, 5, 99, 4.3, 78, 'PUBLISHED', false, 'cat_003', NOW(), NOW()),

  ('place_016', 'otago-museum', 'Otago Museum', '奥塔哥博物馆',
   'Interactive science centre, planetarium, and natural history exhibits. Discovery World for kids.',
   '419 Great King Street, Dunedin',
   -45.8670, 170.5023, 'Dunedin', 'FREE', true, false, true, true, 0, 99, 4.5, 112, 'PUBLISHED', false, 'cat_002', NOW(), NOW()),

  ('place_017', 'st-clair-beach', 'St Clair Beach', '圣克莱尔海滩',
   'Popular beach with playground, salt water pool, and cafe. Good for swimming in summer.',
   'St Clair Esplanade, Dunedin',
   -45.9122, 170.4856, 'Dunedin', 'FREE', false, true, true, false, 0, 99, 4.1, 34, 'PUBLISHED', false, 'cat_005', NOW(), NOW()),

  -- 汉密尔顿
  ('place_018', 'hamilton-gardens', 'Hamilton Gardens', '汉密尔顿花园',
   'Award-winning themed gardens from around the world. Playground and cafe on site.',
   'Cobham Drive, Hamilton',
   -37.7889, 175.2933, 'Hamilton', 'FREE', false, true, true, true, 0, 99, 4.7, 256, 'PUBLISHED', true, 'cat_003', NOW(), NOW()),

  ('place_019', 'hamilton-zoo', 'Hamilton Zoo', '汉密尔顿动物园',
   'Large zoo with native and exotic animals. Face painting and playground for kids.',
   '183 Brymer Road, Hamilton',
   -37.7361, 175.1922, 'Hamilton', 'MEDIUM', false, true, true, true, 1, 99, 4.2, 89, 'PUBLISHED', false, 'cat_006', NOW(), NOW()),

  -- 陶波
  ('place_020', 'huka-falls', 'Huka Falls', '胡卡瀑布',
   'Spectacular waterfall with walking tracks and jet boat rides. Great photo spot.',
   'Wairakei Tourist Park, Taupō',
   -38.6433, 176.0917, 'Taupō', 'FREE', false, true, false, false, 0, 99, 4.6, 312, 'PUBLISHED', true, 'cat_003', NOW(), NOW());

-- ============================================================
-- 4. 场所图片（使用占位图）
-- ============================================================
INSERT INTO place_images (id, "placeId", url, caption, "order", "createdAt") VALUES
  -- 奥克兰
  ('img_001', 'place_001', 'https://images.unsplash.com/photo-1571950006917-5e4f3a16eb4b?w=800', 'Playground climbing frame', 1, NOW()),
  ('img_002', 'place_002', 'https://images.unsplash.com/photo-1554907755-56596bc2d66e?w=800', 'Museum exterior', 1, NOW()),
  ('img_003', 'place_003', 'https://images.unsplash.com/photo-1513889961551-628c1e5e2ee9?w=800', 'Theme park rides', 1, NOW()),
  ('img_004', 'place_004', 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800', 'Aquarium tunnel', 1, NOW()),
  ('img_005', 'place_005', 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800', 'Park view', 1, NOW()),
  ('img_006', 'place_006', 'https://images.unsplash.com/photo-1559241500-f36860f8341a?w=800', 'Indoor play area', 1, NOW()),
  -- 惠灵顿
  ('img_007', 'place_007', 'https://images.unsplash.com/photo-1566127703980-23df6bf571e0?w=800', 'Museum interior', 1, NOW()),
  ('img_008', 'place_008', 'https://images.unsplash.com/photo-1444464666168-49d633b86797?w=800', 'Sanctuary wildlife', 1, NOW()),
  ('img_009', 'place_009', 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800', 'Botanic garden', 1, NOW()),
  ('img_010', 'place_010', 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800', 'Planetarium', 1, NOW()),
  -- 基督城
  ('img_011', 'place_011', 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800', 'Botanic gardens', 1, NOW()),
  ('img_012', 'place_012', 'https://images.unsplash.com/photo-1474511320723-9a56873571b7?w=800', 'Wildlife park', 1, NOW()),
  ('img_013', 'place_013', 'https://images.unsplash.com/photo-1571950006917-5e4f3a16eb4b?w=800', 'Playground', 1, NOW()),
  ('img_014', 'place_014', 'https://images.unsplash.com/photo-1517783999520-f068d7431571?w=800', 'Antarctic centre', 1, NOW()),
  -- 但尼丁
  ('img_015', 'place_015', 'https://images.unsplash.com/photo-1533154683836-84ea7a0bc310?w=800', 'Castle gardens', 1, NOW()),
  ('img_016', 'place_016', 'https://images.unsplash.com/photo-1566127703980-23df6bf571e0?w=800', 'Museum', 1, NOW()),
  ('img_017', 'place_017', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800', 'Beach view', 1, NOW()),
  -- 汉密尔顿
  ('img_018', 'place_018', 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800', 'Gardens', 1, NOW()),
  ('img_019', 'place_019', 'https://images.unsplash.com/photo-1474511320723-9a56873571b7?w=800', 'Zoo', 1, NOW()),
  -- 陶波
  ('img_020', 'place_020', 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=800', 'Waterfall', 1, NOW());

-- ============================================================
-- 5. 营业时间
-- ============================================================
INSERT INTO opening_hours (id, "placeId", "dayOfWeek", "openTime", "closeTime", closed) VALUES
  -- Auckland Domain Playground (dawn to dusk, approximated)
  ('oh_001', 'place_001', 0, '06:00', '20:00', false),
  ('oh_002', 'place_001', 1, '06:00', '20:00', false),
  ('oh_003', 'place_001', 2, '06:00', '20:00', false),
  ('oh_004', 'place_001', 3, '06:00', '20:00', false),
  ('oh_005', 'place_001', 4, '06:00', '20:00', false),
  ('oh_006', 'place_001', 5, '06:00', '20:00', false),
  ('oh_007', 'place_001', 6, '06:00', '20:00', false),

  -- Auckland Museum (closed Mondays)
  ('oh_008', 'place_002', 0, '10:00', '17:00', true),  -- Monday closed
  ('oh_009', 'place_002', 1, '10:00', '17:00', false), -- Tuesday
  ('oh_010', 'place_002', 2, '10:00', '17:00', false), -- Wednesday
  ('oh_011', 'place_002', 3, '10:00', '17:00', false), -- Thursday
  ('oh_012', 'place_002', 4, '10:00', '17:00', false), -- Friday
  ('oh_013', 'place_002', 5, '10:00', '17:00', false), -- Saturday
  ('oh_014', 'place_002', 6, '10:00', '17:00', false), -- Sunday

  -- Rainbow's End
  ('oh_015', 'place_003', 0, '10:00', '17:00', false),
  ('oh_016', 'place_003', 1, '10:00', '17:00', false),
  ('oh_017', 'place_003', 2, '10:00', '17:00', false),
  ('oh_018', 'place_003', 3, '10:00', '17:00', false),
  ('oh_019', 'place_003', 4, '10:00', '17:00', false),
  ('oh_020', 'place_003', 5, '10:00', '18:00', false), -- Weekend extended
  ('oh_021', 'place_003', 6, '10:00', '18:00', false),

  -- Te Papa (daily)
  ('oh_022', 'place_007', 0, '10:00', '18:00', false),
  ('oh_023', 'place_007', 1, '10:00', '18:00', false),
  ('oh_024', 'place_007', 2, '10:00', '18:00', false),
  ('oh_025', 'place_007', 3, '10:00', '18:00', false),
  ('oh_026', 'place_007', 4, '10:00', '18:00', false),
  ('oh_027', 'place_007', 5, '10:00', '18:00', false),
  ('oh_028', 'place_007', 6, '10:00', '18:00', false);

-- ============================================================
-- 6. 评价
-- ============================================================
INSERT INTO reviews (id, content, rating, "visitDate", status, helpful, "userId", "placeId", "createdAt", "updatedAt") VALUES
  ('rev_001', 'Amazing playground! My kids loved the flying fox. Great for a sunny weekend.', 5, '2026-04-10', 'APPROVED', 12, 'usr_003', 'place_001', NOW(), NOW()),
  ('rev_002', 'Good museum with interactive exhibits. The Discovery Centre is perfect for kids 5-10.', 4, '2026-04-08', 'APPROVED', 8, 'usr_003', 'place_002', NOW(), NOW()),
  ('rev_003', 'Expensive but worth it for a full day. Kids Kingdom is great for younger ones.', 4, '2026-03-25', 'APPROVED', 15, 'usr_004', 'place_003', NOW(), NOW()),
  ('rev_004', '孩子们玩得很开心！企鹅馆特别棒。', 5, '2026-04-01', 'APPROVED', 6, 'usr_004', 'place_004', NOW(), NOW()),
  ('rev_005', 'Free museum with tons to see. Kids loved the earthquake house simulation.', 5, '2026-03-20', 'APPROVED', 22, 'usr_003', 'place_007', NOW(), NOW()),
  ('rev_006', 'Beautiful sanctuary. Saw tuatara and many native birds. Kids enjoyed the night tour.', 5, '2026-03-15', 'APPROVED', 9, 'usr_003', 'place_008', NOW(), NOW()),
  ('rev_007', 'Best free playground in Christchurch! Splash pad is perfect for summer.', 5, '2026-04-05', 'APPROVED', 18, 'usr_004', 'place_013', NOW(), NOW()),
  ('rev_008', 'Amazing themed gardens from around the world. Great for photos.', 5, '2026-03-28', 'APPROVED', 14, 'usr_003', 'place_018', NOW(), NOW()),
  ('rev_009', 'Spectacular waterfall! Easy walk from the car park. Kids were amazed.', 5, '2026-04-12', 'APPROVED', 11, 'usr_004', 'place_020', NOW(), NOW());

-- ============================================================
-- 7. 收藏
-- ============================================================
INSERT INTO favorites (id, "userId", "placeId", "createdAt") VALUES
  ('fav_001', 'usr_003', 'place_001', NOW()),
  ('fav_002', 'usr_003', 'place_007', NOW()),
  ('fav_003', 'usr_003', 'place_013', NOW()),
  ('fav_004', 'usr_004', 'place_003', NOW()),
  ('fav_005', 'usr_004', 'place_004', NOW()),
  ('fav_006', 'usr_004', 'place_020', NOW());

-- ============================================================
-- 完成！
-- ============================================================
-- 测试数据包含：
-- - 4 个用户（1 admin, 1 editor, 2 regular）
-- - 8 个分类
-- - 20 个场所（覆盖奥克兰、惠灵顿、基督城、但尼丁、汉密尔顿、陶波）
-- - 20 张图片
-- - 28 条营业时间
-- - 9 条评价
-- - 6 个收藏
