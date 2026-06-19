import { DEMO_MODELS } from "@/lib/mock/menu-3d";
import type { MenuCategory, MenuItem } from "@/lib/types";

/** Reliable seeded placeholder imagery (swap for real assets later). */
const img = (seed: string) =>
  `https://picsum.photos/seed/tabletap-${seed}/640/480`;

export const categories: MenuCategory[] = [
  { id: "cat-starters", name: "Starters", description: "Small plates to share", sortOrder: 1 },
  { id: "cat-mains", name: "Mains", description: "Hearty signature plates", sortOrder: 2 },
  { id: "cat-pizza", name: "Wood-Fired Pizza", description: "72-hour fermented dough", sortOrder: 3 },
  { id: "cat-desserts", name: "Desserts", description: "House-made sweets", sortOrder: 4 },
  { id: "cat-drinks", name: "Drinks", description: "Crafted & classic", sortOrder: 5 },
];

const SIZE = {
  id: "mg-size",
  label: "Size",
  required: true,
  multiple: false,
  options: [
    { id: "sz-reg", label: "Regular", priceDelta: 0 },
    { id: "sz-lg", label: "Large", priceDelta: 3 },
  ],
};

const EXTRAS = {
  id: "mg-extras",
  label: "Add extras",
  required: false,
  multiple: true,
  options: [
    { id: "ex-cheese", label: "Extra cheese", priceDelta: 1.5 },
    { id: "ex-truffle", label: "Truffle oil", priceDelta: 2.5 },
    { id: "ex-egg", label: "Fried egg", priceDelta: 2 },
  ],
};

export const menuItems: MenuItem[] = [
  // Starters
  { id: "itm-bruschetta", categoryId: "cat-starters", name: "Heirloom Bruschetta", description: "Charred sourdough, marinated tomato, basil, aged balsamic.", price: 9.5, imageUrl: img("bruschetta"), tags: ["vegetarian", "popular"], modifiers: [], isAvailable: true },
  { id: "itm-burrata", categoryId: "cat-starters", name: "Creamy Burrata", description: "Burrata, roasted grapes, pistachio, honey, olive oil.", price: 13, imageUrl: img("burrata"), tags: ["vegetarian", "chef-special"], modifiers: [], isAvailable: true },
  { id: "itm-calamari", categoryId: "cat-starters", name: "Crispy Calamari", description: "Lightly fried, lemon aioli, fresh chili.", price: 12.5, imageUrl: img("calamari"), tags: ["spicy"], modifiers: [], isAvailable: true },
  { id: "itm-soup", categoryId: "cat-starters", name: "Roasted Tomato Soup", description: "Slow-roasted tomato, basil oil, sourdough croutons.", price: 8, imageUrl: img("soup"), tags: ["vegetarian", "gluten-free"], modifiers: [SIZE], isAvailable: true },
  { id: "itm-wings", categoryId: "cat-starters", name: "Smoked Wings", description: "Maple-chipotle glaze, blue cheese dip.", price: 11, imageUrl: img("wings"), tags: ["spicy", "popular"], modifiers: [], isAvailable: false },

  // Mains
  { id: "itm-ribeye", categoryId: "cat-mains", name: "Aged Ribeye", description: "10oz dry-aged ribeye, confit garlic, peppercorn jus.", price: 32, imageUrl: img("ribeye"), tags: ["chef-special"], modifiers: [EXTRAS], isAvailable: true },
  { id: "itm-salmon", categoryId: "cat-mains", name: "Miso Glazed Salmon", description: "Pan-seared salmon, charred greens, sesame.", price: 26, imageUrl: img("salmon"), model3dUrl: DEMO_MODELS.fish, tags: ["gluten-free", "popular"], modifiers: [], isAvailable: true },
  { id: "itm-risotto", categoryId: "cat-mains", name: "Wild Mushroom Risotto", description: "Arborio rice, porcini, parmesan, truffle.", price: 21, imageUrl: img("risotto"), tags: ["vegetarian"], modifiers: [EXTRAS], isAvailable: true },
  { id: "itm-burger", categoryId: "cat-mains", name: "Olive & Ash Burger", description: "Dry-aged beef, smoked cheddar, house pickles, brioche.", price: 18, imageUrl: img("burger"), model3dUrl: DEMO_MODELS.hero, tags: ["popular"], modifiers: [EXTRAS], isAvailable: true },
  { id: "itm-chicken", categoryId: "cat-mains", name: "Lemon Herb Chicken", description: "Free-range half chicken, salsa verde, roast potatoes.", price: 23, imageUrl: img("chicken"), tags: ["gluten-free"], modifiers: [], isAvailable: true },
  { id: "itm-gnocchi", categoryId: "cat-mains", name: "Brown Butter Gnocchi", description: "Pillowy potato gnocchi, sage, parmesan.", price: 19, imageUrl: img("gnocchi"), tags: ["vegetarian", "new"], modifiers: [], isAvailable: true },

  // Pizza
  { id: "itm-margherita", categoryId: "cat-pizza", name: "Margherita", description: "San Marzano, fior di latte, basil.", price: 15, imageUrl: img("margherita"), model3dUrl: DEMO_MODELS.food, tags: ["vegetarian", "popular"], modifiers: [SIZE, EXTRAS], isAvailable: true },
  { id: "itm-pepperoni", categoryId: "cat-pizza", name: "Spicy Pepperoni", description: "Double pepperoni, chili honey, mozzarella.", price: 17, imageUrl: img("pepperoni"), tags: ["spicy", "popular"], modifiers: [SIZE, EXTRAS], isAvailable: true },
  { id: "itm-funghi", categoryId: "cat-pizza", name: "Tartufo Funghi", description: "Wild mushroom, truffle cream, taleggio.", price: 19, imageUrl: img("funghi"), tags: ["vegetarian", "chef-special"], modifiers: [SIZE], isAvailable: true },
  { id: "itm-veggie", categoryId: "cat-pizza", name: "Garden Veggie", description: "Zucchini, peppers, red onion, vegan mozzarella.", price: 16, imageUrl: img("veggie"), tags: ["vegan"], modifiers: [SIZE], isAvailable: true },
  { id: "itm-diavola", categoryId: "cat-pizza", name: "Diavola", description: "Spicy salami, nduja, chili, mozzarella.", price: 18, imageUrl: img("diavola"), tags: ["spicy"], modifiers: [SIZE, EXTRAS], isAvailable: false },

  // Desserts
  { id: "itm-tiramisu", categoryId: "cat-desserts", name: "Classic Tiramisu", description: "Espresso-soaked savoiardi, mascarpone, cocoa.", price: 9, imageUrl: img("tiramisu"), tags: ["vegetarian", "popular"], modifiers: [], isAvailable: true },
  { id: "itm-lava", categoryId: "cat-desserts", name: "Molten Chocolate", description: "Warm chocolate fondant, vanilla bean gelato.", price: 10, imageUrl: img("lava"), tags: ["vegetarian", "chef-special"], modifiers: [], isAvailable: true },
  { id: "itm-cheesecake", categoryId: "cat-desserts", name: "Basque Cheesecake", description: "Burnt-top cheesecake, macerated berries.", price: 9.5, imageUrl: img("cheesecake"), tags: ["vegetarian", "new"], modifiers: [], isAvailable: true },
  { id: "itm-sorbet", categoryId: "cat-desserts", name: "Citrus Sorbet", description: "Trio of seasonal sorbets.", price: 7, imageUrl: img("sorbet"), tags: ["vegan", "gluten-free"], modifiers: [], isAvailable: true },

  // Drinks
  { id: "itm-negroni", categoryId: "cat-drinks", name: "Barrel-Aged Negroni", description: "Gin, Campari, sweet vermouth, orange.", price: 14, imageUrl: img("negroni"), tags: ["popular"], modifiers: [], isAvailable: true },
  { id: "itm-spritz", categoryId: "cat-drinks", name: "Elderflower Spritz", description: "Elderflower, prosecco, soda, mint.", price: 12, imageUrl: img("spritz"), tags: ["new"], modifiers: [], isAvailable: true },
  { id: "itm-coldbrew", categoryId: "cat-drinks", name: "House Cold Brew", description: "18-hour steeped, single origin.", price: 5, imageUrl: img("coldbrew"), tags: ["vegan"], modifiers: [SIZE], isAvailable: true },
  { id: "itm-lemonade", categoryId: "cat-drinks", name: "Sicilian Lemonade", description: "Fresh-pressed lemon, basil, sparkling.", price: 6, imageUrl: img("lemonade"), tags: ["vegan", "gluten-free"], modifiers: [SIZE], isAvailable: true },
];
