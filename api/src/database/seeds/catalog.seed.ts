import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

import { Category } from '@modules/category/entities/category.entity';
import { Menu } from '@modules/menus/entities/menu.entity';
import { MenuItem } from '@modules/menu/entities/menu-item.entity';
import { FoodType } from '@modules/food-type/entities/food-type.entity';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

/**
 * Catalog seeder — FLUSHES all categories/menus/menu-items, then inserts a large
 * batch of realistic dummy data (default ~260 items) to load-test the system.
 *
 * Orders are preserved: `order_items.menuItemId` is ON DELETE SET NULL, and line
 * items keep their denormalized name/price. Run with:
 *   docker exec tabletap-api npm run db:seed:catalog
 * Override the item count with SEED_ITEMS (clamped 50–1000).
 */

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST || 'tabletap-postgres',
  port: parseInt(process.env.POSTGRES_PORT, 10) || 5432,
  username: process.env.POSTGRES_USER || 'tabletap_user',
  password: process.env.POSTGRES_PASSWORD || 'secret',
  database: process.env.POSTGRES_DATABASE || 'tabletap_db',
  entities: [Category, Menu, MenuItem, FoodType],
  synchronize: false,
});

// ── Reference data ──────────────────────────────────────────────────────────

const FOOD_IMG = [
  '1504674900247-0877df9cc836',
  '1546069901-ba9599a7e63c',
  '1565299624946-b28f40a0ae38',
  '1567620905732-2d1ec7ab7445',
  '1565958011703-44f9829ba187',
  '1551782450-a2132b4ba21d',
  '1571091718767-18b5b1457add',
  '1513104890138-7c749659a591',
  '1544025162-d76694265947',
  '1476124369491-e7addf5db371',
  '1550547660-d9450f859349',
  '1432139555190-58524dae6a55',
  '1414235077428-338989a2e8c0',
  '1482049016688-2d3e1b311543',
  '1467003909585-2f8a72700288',
];
const img = (i: number) =>
  `https://images.unsplash.com/photo-${FOOD_IMG[i % FOOD_IMG.length]}?auto=format&fit=crop&w=600&h=600&q=70`;

const ADJ = [
  'Classic', 'Spicy', 'Grilled', 'Crispy', 'House', 'Signature', 'Smoked', 'Truffle',
  'Garlic', "Chef's", 'Creamy', 'Zesty', 'Loaded', 'Char-grilled', 'Peri Peri', 'BBQ',
  'Honey', 'Tandoori', 'Cheesy', 'Golden', 'Rustic', 'Deluxe',
];

interface CatDef {
  name: string;
  price: [number, number];
  dishes: string[];
  sizes?: boolean;
}

const CATS: CatDef[] = [
  { name: 'Starters', price: [5, 12], dishes: ['Bruschetta', 'Calamari Rings', 'Spring Rolls', 'Stuffed Mushrooms', 'Chicken Wings', 'Mozzarella Sticks', 'Nachos Supreme', 'Hummus Platter', 'Onion Rings', 'Chilli Garlic Prawns'] },
  { name: 'Soups', price: [4, 9], dishes: ['Tomato Basil Soup', 'Chicken Corn Soup', 'Hot & Sour Soup', 'Minestrone', 'Lentil Soup', 'Mushroom Soup', 'Thai Coconut Soup'] },
  { name: 'Salads', price: [6, 14], dishes: ['Caesar Salad', 'Greek Salad', 'Caprese Salad', 'Quinoa Bowl', 'Garden Salad', 'Chicken Avocado Salad', 'Nicoise Salad'] },
  { name: 'Wood-Fired Pizza', price: [10, 24], dishes: ['Margherita', 'Pepperoni', 'Four Cheese', 'BBQ Chicken', 'Veggie Supreme', 'Prosciutto & Arugula', 'Mushroom Truffle', 'Hawaiian'], sizes: true },
  { name: 'Pasta', price: [9, 20], dishes: ['Spaghetti Bolognese', 'Fettuccine Alfredo', 'Penne Arrabbiata', 'Lasagne', 'Carbonara', 'Pesto Linguine', 'Mac & Cheese', 'Seafood Marinara'] },
  { name: 'Burgers', price: [8, 18], dishes: ['Cheeseburger', 'Double Beef Burger', 'Chicken Burger', 'Bacon Burger', 'Mushroom Swiss Burger', 'Veggie Burger', 'Smash Burger', 'Fish Burger'] },
  { name: 'Sandwiches & Wraps', price: [6, 14], dishes: ['Club Sandwich', 'Chicken Shawarma Wrap', 'Falafel Wrap', 'Grilled Panini', 'BLT', 'Steak Sandwich', 'Tuna Melt', 'Veggie Wrap'] },
  { name: 'Grill & BBQ', price: [12, 30], dishes: ['Ribeye Steak', 'BBQ Ribs', 'Grilled Chicken', 'Lamb Chops', 'Mixed Grill Platter', 'Beef Skewers', 'Chicken Tikka', 'Pulled Pork'] },
  { name: 'Seafood', price: [12, 28], dishes: ['Grilled Salmon', 'Fish & Chips', 'Garlic Butter Shrimp', 'Seared Tuna', 'Crab Cakes', 'Lobster Roll', 'Fried Calamari', 'Grilled Prawns'] },
  { name: 'Rice & Biryani', price: [8, 18], dishes: ['Chicken Biryani', 'Mutton Biryani', 'Vegetable Pulao', 'Egg Fried Rice', 'Prawn Biryani', 'Jeera Rice', 'Kabuli Pulao'] },
  { name: 'Curries', price: [9, 18], dishes: ['Butter Chicken', 'Chicken Karahi', 'Palak Paneer', 'Beef Nihari', 'Daal Makhani', 'Chana Masala', 'Fish Curry', 'Chicken Korma'] },
  { name: 'Sides', price: [3, 8], dishes: ['French Fries', 'Garlic Bread', 'Coleslaw', 'Mashed Potatoes', 'Steamed Veggies', 'Cheese Fries', 'Buttered Rice', 'Naan'] },
  { name: 'Desserts', price: [4, 11], dishes: ['Chocolate Lava Cake', 'Cheesecake', 'Tiramisu', 'Gulab Jamun', 'Ice Cream Sundae', 'Fudge Brownie', 'Creme Brulee', 'Fruit Tart'] },
  { name: 'Cold Beverages', price: [2, 7], dishes: ['Fresh Lemonade', 'Iced Tea', 'Mango Lassi', 'Cola', 'Sparkling Water', 'Fruit Smoothie', 'Iced Coffee', 'Mint Margarita'], sizes: true },
  { name: 'Hot Drinks', price: [2, 6], dishes: ['Espresso', 'Cappuccino', 'Latte', 'Green Tea', 'Masala Chai', 'Hot Chocolate', 'Americano', 'Flat White'], sizes: true },
  { name: 'Kids Menu', price: [4, 9], dishes: ['Mini Cheeseburger', 'Chicken Nuggets', 'Mini Mac & Cheese', 'Fish Fingers', 'Mini Pizza', 'Pancakes', 'Grilled Cheese'] },
];

const MENUS = [
  'Breakfast', 'Brunch', 'Lunch', 'Dinner', 'Late Night', 'Weekend Special', 'Family Feast', 'Drinks & Desserts',
];

// ── Helpers ─────────────────────────────────────────────────────────────────

const rand = (n: number) => Math.floor(Math.random() * n);
const pick = <T,>(arr: T[]) => arr[rand(arr.length)];

/** Random price within [min,max], rounded to a friendly .49/.99 ending. */
function priceIn([min, max]: [number, number]): number {
  const base = min + Math.random() * (max - min);
  return Math.floor(base) + (Math.random() < 0.5 ? 0.49 : 0.99);
}

function sizesFor(base: number): { name: string; price: number }[] {
  return [
    { name: 'Small', price: Math.round((base - 2) * 100) / 100 },
    { name: 'Medium', price: base },
    { name: 'Large', price: Math.round((base + 3) * 100) / 100 },
  ];
}

/** 1–3 random distinct menus for an item. */
function assignMenus(menus: Menu[]): Menu[] {
  const count = 1 + rand(3);
  const shuffled = [...menus].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// ── Seed ────────────────────────────────────────────────────────────────────

async function seed() {
  const target = Math.min(1000, Math.max(50, parseInt(process.env.SEED_ITEMS || '260', 10)));
  let connected = false;

  try {
    console.log('🔌 Connecting to database…');
    await AppDataSource.initialize();
    connected = true;
    console.log('📦 Connected\n');

    // ── Flush (order matters; orders/order_items are preserved) ──
    console.log('🧹 Flushing categories, menus, and items…');
    await AppDataSource.query('DELETE FROM "menu_item_menus"');
    await AppDataSource.query('DELETE FROM "menu_item_food_types"');
    await AppDataSource.query('DELETE FROM "menu_items"'); // order_items.menuItemId → NULL
    await AppDataSource.query('DELETE FROM "menus"');
    await AppDataSource.query('DELETE FROM "categories"');
    console.log('   ✔ cleared\n');

    const categoryRepo = AppDataSource.getRepository(Category);
    const menuRepo = AppDataSource.getRepository(Menu);
    const itemRepo = AppDataSource.getRepository(MenuItem);

    // ── Categories ──
    console.log(`🗂  Inserting ${CATS.length} categories…`);
    const categories = await categoryRepo.save(
      CATS.map((c, i) =>
        categoryRepo.create({
          name: c.name,
          description: `${c.name} — freshly prepared favourites.`,
          imageUrl: img(i),
          sortOrder: i,
          isActive: true,
        }),
      ),
    );

    // ── Menus ──
    console.log(`📖 Inserting ${MENUS.length} menus…`);
    const menus = await menuRepo.save(
      MENUS.map((name, i) =>
        menuRepo.create({
          name,
          description: `${name} selection.`,
          imageUrl: img(i + 3),
          sortOrder: i,
          isActive: true,
        }),
      ),
    );

    // ── Items ── generate `target` items spread across categories ──
    console.log(`🍽  Generating ${target} menu items…`);
    const perCat = Math.ceil(target / CATS.length);
    const items: MenuItem[] = [];
    let imgIdx = 0;

    for (let ci = 0; ci < CATS.length && items.length < target; ci++) {
      const def = CATS[ci];
      const category = categories[ci];
      const used = new Set<string>();

      for (let n = 0; n < perCat && items.length < target; n++) {
        const dish = def.dishes[n % def.dishes.length];
        const adj = ADJ[(n + ci) % ADJ.length];
        let name = `${adj} ${dish}`;
        // Keep names distinct within a category.
        if (used.has(name)) name = `${name} #${n + 1}`;
        used.add(name);

        const price = priceIn(def.price);
        const item = itemRepo.create({
          name,
          description: `${dish} with a ${adj.toLowerCase()} twist — a house favourite.`,
          price,
          imageUrl: img(imgIdx++),
          images: [],
          // ~12% of items are "86'd" to exercise availability handling.
          isAvailable: Math.random() > 0.12,
          categoryId: category.id,
          menus: assignMenus(menus),
          sizes: def.sizes ? sizesFor(price) : [],
          variants: [],
          addOns: [],
        });
        items.push(item);
      }
    }

    console.log(`   💾 Saving ${items.length} items (chunked)…`);
    await itemRepo.save(items, { chunk: 50 });

    // ── Summary ──
    const [catCount, menuCount, itemCount, unavailable, joinCount] = await Promise.all([
      categoryRepo.count(),
      menuRepo.count(),
      itemRepo.count(),
      itemRepo.count({ where: { isAvailable: false } }),
      AppDataSource.query('SELECT COUNT(*)::int AS c FROM "menu_item_menus"').then((r) => r[0].c),
    ]);

    console.log('\n✅ Catalog seeded:');
    console.log(`   • ${catCount} categories`);
    console.log(`   • ${menuCount} menus`);
    console.log(`   • ${itemCount} items (${unavailable} marked unavailable)`);
    console.log(`   • ${joinCount} item↔menu links`);
  } catch (error) {
    console.error('❌ Catalog seeding failed:', (error as Error).message || error);
    process.exitCode = 1;
  } finally {
    if (connected) await AppDataSource.destroy();
    process.exit(process.exitCode ?? 0);
  }
}

seed();
