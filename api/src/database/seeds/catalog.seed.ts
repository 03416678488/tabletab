import { DataSource } from 'typeorm';

import { Category } from '@modules/category/entities/category.entity';
import { Menu } from '@modules/menus/entities/menu.entity';
import { MenuItem } from '@modules/menu/entities/menu-item.entity';
import { Branch } from '@modules/branch/entities/branch.entity';

/**
 * Seed a full demo catalogue. Categories + menus are PER-BRANCH; the item
 * catalogue is GLOBAL — each item is created once and placed into every branch's
 * matching category, so every branch carries it (no duplication). Flushes the
 * existing catalogue first. This is a module invoked by the main `db:seed` (not a
 * standalone script). Override the item count with SEED_ITEMS (clamped 50–1000).
 */

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
  'Classic',
  'Spicy',
  'Grilled',
  'Crispy',
  'House',
  'Signature',
  'Smoked',
  'Truffle',
  'Garlic',
  "Chef's",
  'Creamy',
  'Zesty',
  'Loaded',
  'Char-grilled',
  'Peri Peri',
  'BBQ',
  'Honey',
  'Tandoori',
  'Cheesy',
  'Golden',
  'Rustic',
  'Deluxe',
];

interface CatDef {
  name: string;
  price: [number, number];
  dishes: string[];
  sizes?: boolean;
}

const CATS: CatDef[] = [
  {
    name: 'Starters',
    price: [5, 12],
    dishes: [
      'Bruschetta',
      'Calamari Rings',
      'Spring Rolls',
      'Stuffed Mushrooms',
      'Chicken Wings',
      'Mozzarella Sticks',
      'Nachos Supreme',
      'Hummus Platter',
      'Onion Rings',
      'Chilli Garlic Prawns',
    ],
  },
  {
    name: 'Soups',
    price: [4, 9],
    dishes: [
      'Tomato Basil Soup',
      'Chicken Corn Soup',
      'Hot & Sour Soup',
      'Minestrone',
      'Lentil Soup',
      'Mushroom Soup',
      'Thai Coconut Soup',
    ],
  },
  {
    name: 'Salads',
    price: [6, 14],
    dishes: [
      'Caesar Salad',
      'Greek Salad',
      'Caprese Salad',
      'Quinoa Bowl',
      'Garden Salad',
      'Chicken Avocado Salad',
      'Nicoise Salad',
    ],
  },
  {
    name: 'Wood-Fired Pizza',
    price: [10, 24],
    dishes: [
      'Margherita',
      'Pepperoni',
      'Four Cheese',
      'BBQ Chicken',
      'Veggie Supreme',
      'Prosciutto & Arugula',
      'Mushroom Truffle',
      'Hawaiian',
    ],
    sizes: true,
  },
  {
    name: 'Pasta',
    price: [9, 20],
    dishes: [
      'Spaghetti Bolognese',
      'Fettuccine Alfredo',
      'Penne Arrabbiata',
      'Lasagne',
      'Carbonara',
      'Pesto Linguine',
      'Mac & Cheese',
      'Seafood Marinara',
    ],
  },
  {
    name: 'Burgers',
    price: [8, 18],
    dishes: [
      'Cheeseburger',
      'Double Beef Burger',
      'Chicken Burger',
      'Bacon Burger',
      'Mushroom Swiss Burger',
      'Veggie Burger',
      'Smash Burger',
      'Fish Burger',
    ],
  },
  {
    name: 'Sandwiches & Wraps',
    price: [6, 14],
    dishes: [
      'Club Sandwich',
      'Chicken Shawarma Wrap',
      'Falafel Wrap',
      'Grilled Panini',
      'BLT',
      'Steak Sandwich',
      'Tuna Melt',
      'Veggie Wrap',
    ],
  },
  {
    name: 'Grill & BBQ',
    price: [12, 30],
    dishes: [
      'Ribeye Steak',
      'BBQ Ribs',
      'Grilled Chicken',
      'Lamb Chops',
      'Mixed Grill Platter',
      'Beef Skewers',
      'Chicken Tikka',
      'Pulled Pork',
    ],
  },
  {
    name: 'Seafood',
    price: [12, 28],
    dishes: [
      'Grilled Salmon',
      'Fish & Chips',
      'Garlic Butter Shrimp',
      'Seared Tuna',
      'Crab Cakes',
      'Lobster Roll',
      'Fried Calamari',
      'Grilled Prawns',
    ],
  },
  {
    name: 'Rice & Biryani',
    price: [8, 18],
    dishes: [
      'Chicken Biryani',
      'Mutton Biryani',
      'Vegetable Pulao',
      'Egg Fried Rice',
      'Prawn Biryani',
      'Jeera Rice',
      'Kabuli Pulao',
    ],
  },
  {
    name: 'Curries',
    price: [9, 18],
    dishes: [
      'Butter Chicken',
      'Chicken Karahi',
      'Palak Paneer',
      'Beef Nihari',
      'Daal Makhani',
      'Chana Masala',
      'Fish Curry',
      'Chicken Korma',
    ],
  },
  {
    name: 'Sides',
    price: [3, 8],
    dishes: [
      'French Fries',
      'Garlic Bread',
      'Coleslaw',
      'Mashed Potatoes',
      'Steamed Veggies',
      'Cheese Fries',
      'Buttered Rice',
      'Naan',
    ],
  },
  {
    name: 'Desserts',
    price: [4, 11],
    dishes: [
      'Chocolate Lava Cake',
      'Cheesecake',
      'Tiramisu',
      'Gulab Jamun',
      'Ice Cream Sundae',
      'Fudge Brownie',
      'Creme Brulee',
      'Fruit Tart',
    ],
  },
  {
    name: 'Cold Beverages',
    price: [2, 7],
    dishes: [
      'Fresh Lemonade',
      'Iced Tea',
      'Mango Lassi',
      'Cola',
      'Sparkling Water',
      'Fruit Smoothie',
      'Iced Coffee',
      'Mint Margarita',
    ],
    sizes: true,
  },
  {
    name: 'Hot Drinks',
    price: [2, 6],
    dishes: [
      'Espresso',
      'Cappuccino',
      'Latte',
      'Green Tea',
      'Masala Chai',
      'Hot Chocolate',
      'Americano',
      'Flat White',
    ],
    sizes: true,
  },
  {
    name: 'Kids Menu',
    price: [4, 9],
    dishes: [
      'Mini Cheeseburger',
      'Chicken Nuggets',
      'Mini Mac & Cheese',
      'Fish Fingers',
      'Mini Pizza',
      'Pancakes',
      'Grilled Cheese',
    ],
  },
];

const MENUS = [
  'Breakfast',
  'Brunch',
  'Lunch',
  'Dinner',
  'Late Night',
  'Weekend Special',
  'Family Feast',
  'Drinks & Desserts',
];

// ── Helpers ─────────────────────────────────────────────────────────────────

const rand = (n: number) => Math.floor(Math.random() * n);

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

export async function seedCatalog(dataSource: DataSource): Promise<void> {
  const target = Math.min(
    1000,
    Math.max(50, parseInt(process.env.SEED_ITEMS || '260', 10)),
  );

  // ── Flush (order matters; orders/order_items are preserved) ──
  console.log('\n🍽️  Seeding catalogue…');
  console.log('🧹 Flushing categories, menus, and items…');
  await dataSource.query('DELETE FROM "menu_item_categories"');
  await dataSource.query('DELETE FROM "menu_item_menus"');
  await dataSource.query('DELETE FROM "menu_item_food_types"');
  await dataSource.query('DELETE FROM "menu_items"'); // order_items.menuItemId → NULL
  await dataSource.query('DELETE FROM "menus"');
  await dataSource.query('DELETE FROM "categories"');
  console.log('   ✔ cleared\n');

  const categoryRepo = dataSource.getRepository(Category);
  const menuRepo = dataSource.getRepository(Menu);
  const itemRepo = dataSource.getRepository(MenuItem);
  const branchRepo = dataSource.getRepository(Branch);

  // Categories + menus are PER-BRANCH; items are GLOBAL. Build each branch's
  // categories/menus first, then create each item once and place it into the
  // same-named category at every branch (so every branch carries it).
  const branches = await branchRepo.find({ order: { name: 'ASC' } });
  const scopes: { id: string | null; name: string }[] = branches.length
    ? branches.map((b) => ({ id: b.id, name: b.name }))
    : [{ id: null, name: 'default (no branch)' }];
  console.log(
    `🏬 Seeding per-branch categories/menus for ${scopes.length} branch(es): ${scopes
      .map((s) => s.name)
      .join(', ')}\n`,
  );

  const perBranch: { categories: Category[]; menus: Menu[] }[] = [];
  for (const scope of scopes) {
    const categories = await categoryRepo.save(
      CATS.map((c, i) =>
        categoryRepo.create({
          name: c.name,
          description: `${c.name} — freshly prepared favourites.`,
          imageUrl: img(i),
          sortOrder: i,
          isActive: true,
          branchId: scope.id,
        }),
      ),
    );
    const menus = await menuRepo.save(
      MENUS.map((name, i) =>
        menuRepo.create({
          name,
          description: `${name} selection.`,
          imageUrl: img(i + 3),
          sortOrder: i,
          isActive: true,
          branchId: scope.id,
        }),
      ),
    );
    perBranch.push({ categories, menus });
    console.log(
      `   ✔ ${scope.name}: ${categories.length} categories · ${menus.length} menus`,
    );
  }

  // ── Items (GLOBAL): created once, carried at every branch ──
  let imgIdx = 0;
  const perCat = Math.ceil(target / CATS.length);
  const items: MenuItem[] = [];
  for (let ci = 0; ci < CATS.length && items.length < target; ci++) {
    const def = CATS[ci];
    const used = new Set<string>();
    for (let n = 0; n < perCat && items.length < target; n++) {
      const dish = def.dishes[n % def.dishes.length];
      const adj = ADJ[(n + ci) % ADJ.length];
      let name = `${adj} ${dish}`;
      if (used.has(name)) name = `${name} #${n + 1}`;
      used.add(name);

      const price = priceIn(def.price);
      items.push(
        itemRepo.create({
          name,
          description: `${dish} with a ${adj.toLowerCase()} twist — a house favourite.`,
          price,
          imageUrl: img(imgIdx++),
          images: [],
          // ~12% of items are "86'd" to exercise availability handling.
          isAvailable: Math.random() > 0.12,
          // Carried at every branch via that branch's matching category.
          categories: perBranch.map((b) => b.categories[ci]),
          menus: perBranch.flatMap((b) => assignMenus(b.menus)),
          sizes: def.sizes ? sizesFor(price) : [],
          variants: [],
          addOns: [],
        }),
      );
    }
  }
  await itemRepo.save(items, { chunk: 50 });
  const grandTotalItems = items.length;
  console.log(
    `\n💾 Saved ${grandTotalItems} GLOBAL items, each carried at ${scopes.length} branch(es).`,
  );

  // ── Summary ──
  const [catCount, menuCount, itemCount, unavailable, joinCount] =
    await Promise.all([
      categoryRepo.count(),
      menuRepo.count(),
      itemRepo.count(),
      itemRepo.count({ where: { isAvailable: false } }),
      dataSource
        .query('SELECT COUNT(*)::int AS c FROM "menu_item_menus"')
        .then((r) => r[0].c),
    ]);

  console.log('\n✅ Catalogue seeded:');
  console.log(`   • ${catCount} categories`);
  console.log(`   • ${menuCount} menus`);
  console.log(`   • ${itemCount} items (${unavailable} marked unavailable)`);
  console.log(`   • ${joinCount} item↔menu links`);
}
