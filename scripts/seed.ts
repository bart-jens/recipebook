/**
 * Seed script — populates the database with realistic test recipes.
 *
 * Usage:
 *   npx tsx scripts/seed.ts <email> <password>
 *
 * Seeds as the authenticated user. Requires valid login credentials.
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://lnuomkklhirofwkkjzzp.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxudW9ta2tsaGlyb2Z3a2tqenpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5NTI1ODMsImV4cCI6MjA4NjUyODU4M30.sapEV8d7npj5J5OFYYL2G5SWI8KwegMq6VkyLq1K6Mg";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── Food photos (Unsplash, free to use) ──────────────────────────────
const IMAGES = {
  pasta: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800&q=80",
  salad: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80",
  steak: "https://images.unsplash.com/photo-1600891964092-4316c288032e?w=800&q=80",
  soup: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=80",
  tacos: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&q=80",
  pizza: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&q=80",
  curry: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&q=80",
  cake: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&q=80",
  burger: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80",
  sushi: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&q=80",
  bread: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80",
  risotto: "https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=800&q=80",
  pancakes: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&q=80",
  ramen: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80",
  smoothie: "https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=800&q=80",
};

// ── Recipe data ──────────────────────────────────────────────────────
const RECIPES = [
  {
    title: "Creamy Garlic Tuscan Pasta",
    description: "A rich, creamy pasta loaded with sun-dried tomatoes, spinach, and parmesan. Ready in 25 minutes.",
    instructions: "Cook penne according to package directions.\nIn a large skillet, saute minced garlic in olive oil for 1 minute.\nAdd sun-dried tomatoes and cook 2 minutes.\nPour in heavy cream and bring to a gentle simmer.\nStir in parmesan until melted and smooth.\nAdd fresh spinach and toss until wilted.\nDrain pasta and add to the sauce, tossing to coat.\nSeason with salt, pepper, and red pepper flakes.\nServe immediately with extra parmesan on top.",
    prep_time_minutes: 10,
    cook_time_minutes: 15,
    servings: 4,
    source_type: "manual" as const,
    image_url: IMAGES.pasta,
    visibility: "public" as const,
    published_at: new Date().toISOString(),
    ingredients: [
      { ingredient_name: "Penne pasta", quantity: 400, unit: "g", notes: "", order_index: 0 },
      { ingredient_name: "Heavy cream", quantity: 250, unit: "ml", notes: "", order_index: 1 },
      { ingredient_name: "Garlic", quantity: 4, unit: "cloves", notes: "minced", order_index: 2 },
      { ingredient_name: "Sun-dried tomatoes", quantity: 100, unit: "g", notes: "chopped", order_index: 3 },
      { ingredient_name: "Fresh spinach", quantity: 150, unit: "g", notes: "", order_index: 4 },
      { ingredient_name: "Parmesan cheese", quantity: 80, unit: "g", notes: "grated", order_index: 5 },
      { ingredient_name: "Olive oil", quantity: 2, unit: "tbsp", notes: "", order_index: 6 },
      { ingredient_name: "Red pepper flakes", quantity: 0.5, unit: "tsp", notes: "optional", order_index: 7 },
    ],
    tags: ["pasta", "italian", "quick", "vegetarian"],
    ratings: [
      { rating: 5, notes: "Amazing comfort food, the whole family loved it", cooked_date: "2026-02-10" },
      { rating: 4, notes: "Great flavor, used half-and-half instead of cream", cooked_date: "2026-01-28" },
    ],
  },
  {
    title: "Thai Green Curry with Chicken",
    description: "Fragrant coconut curry with tender chicken, Thai basil, and crisp vegetables. Better than takeout.",
    instructions: "Cut chicken into bite-sized pieces and season with salt.\nHeat oil in a wok or large pan over high heat.\nAdd green curry paste and fry for 1 minute until fragrant.\nAdd chicken and cook until sealed on all sides.\nPour in coconut milk and bring to a simmer.\nAdd bamboo shoots, bell pepper, and green beans.\nSimmer for 10 minutes until chicken is cooked through.\nStir in fish sauce, palm sugar, and lime juice.\nTear in Thai basil leaves and serve over jasmine rice.",
    prep_time_minutes: 15,
    cook_time_minutes: 20,
    servings: 4,
    source_type: "manual" as const,
    image_url: IMAGES.curry,
    visibility: "public" as const,
    published_at: new Date().toISOString(),
    ingredients: [
      { ingredient_name: "Chicken thighs", quantity: 500, unit: "g", notes: "boneless", order_index: 0 },
      { ingredient_name: "Green curry paste", quantity: 3, unit: "tbsp", notes: "", order_index: 1 },
      { ingredient_name: "Coconut milk", quantity: 400, unit: "ml", notes: "full fat", order_index: 2 },
      { ingredient_name: "Bamboo shoots", quantity: 100, unit: "g", notes: "drained", order_index: 3 },
      { ingredient_name: "Bell pepper", quantity: 1, unit: "", notes: "sliced", order_index: 4 },
      { ingredient_name: "Green beans", quantity: 100, unit: "g", notes: "trimmed", order_index: 5 },
      { ingredient_name: "Fish sauce", quantity: 2, unit: "tbsp", notes: "", order_index: 6 },
      { ingredient_name: "Thai basil", quantity: 1, unit: "bunch", notes: "", order_index: 7 },
      { ingredient_name: "Jasmine rice", quantity: 300, unit: "g", notes: "for serving", order_index: 8 },
    ],
    tags: ["thai", "curry", "chicken", "spicy"],
    ratings: [
      { rating: 5, notes: "Incredible depth of flavor", cooked_date: "2026-02-12" },
    ],
  },
  {
    title: "Classic Margherita Pizza",
    description: "Neapolitan-style pizza with San Marzano tomatoes, fresh mozzarella, and basil on a chewy crust.",
    instructions: "Mix flour, yeast, salt, and water. Knead for 10 minutes until smooth.\nLet dough rise for 1 hour covered.\nPreheat oven to highest setting (250C/500F) with a pizza stone or inverted baking sheet.\nCrush San Marzano tomatoes by hand with a pinch of salt.\nStretch dough into a 12-inch round on a floured surface.\nSpread a thin layer of crushed tomatoes.\nTear mozzarella into pieces and distribute evenly.\nDrizzle with olive oil.\nBake for 8-10 minutes until crust is charred and cheese is bubbling.\nTop with fresh basil leaves and serve immediately.",
    prep_time_minutes: 20,
    cook_time_minutes: 10,
    servings: 2,
    source_type: "manual" as const,
    image_url: IMAGES.pizza,
    visibility: "public" as const,
    published_at: new Date().toISOString(),
    ingredients: [
      { ingredient_name: "Bread flour", quantity: 300, unit: "g", notes: "tipo 00 if available", order_index: 0 },
      { ingredient_name: "Instant yeast", quantity: 1, unit: "tsp", notes: "", order_index: 1 },
      { ingredient_name: "Salt", quantity: 1, unit: "tsp", notes: "", order_index: 2 },
      { ingredient_name: "Water", quantity: 200, unit: "ml", notes: "warm", order_index: 3 },
      { ingredient_name: "San Marzano tomatoes", quantity: 200, unit: "g", notes: "canned", order_index: 4 },
      { ingredient_name: "Fresh mozzarella", quantity: 200, unit: "g", notes: "", order_index: 5 },
      { ingredient_name: "Fresh basil", quantity: 1, unit: "bunch", notes: "", order_index: 6 },
      { ingredient_name: "Extra virgin olive oil", quantity: 2, unit: "tbsp", notes: "", order_index: 7 },
    ],
    tags: ["pizza", "italian", "baking"],
    ratings: [
      { rating: 5, notes: "Best homemade pizza I've ever made", cooked_date: "2026-02-08" },
      { rating: 4, notes: "The dough was perfect, need a hotter oven next time", cooked_date: "2026-01-15" },
      { rating: 5, notes: null, cooked_date: "2026-02-14" },
    ],
  },
  {
    title: "Smashed Burger with Special Sauce",
    description: "Thin, crispy-edged smashed patties with melted cheese and a tangy special sauce. The best weeknight burger.",
    instructions: "Divide ground beef into 4 equal balls (about 100g each).\nMix mayo, ketchup, relish, mustard, and a splash of vinegar for the sauce.\nHeat a cast iron skillet over high heat until smoking.\nPlace a beef ball on the skillet and smash flat with a sturdy spatula.\nSeason generously with salt and pepper.\nCook 2 minutes until edges are deeply browned and crispy.\nFlip, add a slice of cheese, and cook 1 more minute.\nToast buns in the pan with a little butter.\nAssemble: bottom bun, sauce, lettuce, double patty stack, pickles, onion, more sauce, top bun.",
    prep_time_minutes: 10,
    cook_time_minutes: 10,
    servings: 2,
    source_type: "manual" as const,
    image_url: IMAGES.burger,
    visibility: "public" as const,
    published_at: new Date().toISOString(),
    ingredients: [
      { ingredient_name: "Ground beef", quantity: 400, unit: "g", notes: "80/20 blend", order_index: 0 },
      { ingredient_name: "American cheese", quantity: 4, unit: "slices", notes: "", order_index: 1 },
      { ingredient_name: "Brioche buns", quantity: 2, unit: "", notes: "", order_index: 2 },
      { ingredient_name: "Mayonnaise", quantity: 3, unit: "tbsp", notes: "", order_index: 3 },
      { ingredient_name: "Ketchup", quantity: 1, unit: "tbsp", notes: "", order_index: 4 },
      { ingredient_name: "Dill pickles", quantity: 4, unit: "slices", notes: "", order_index: 5 },
      { ingredient_name: "Iceberg lettuce", quantity: 2, unit: "leaves", notes: "", order_index: 6 },
      { ingredient_name: "White onion", quantity: 0.5, unit: "", notes: "thinly sliced", order_index: 7 },
    ],
    tags: ["burger", "american", "quick"],
    ratings: [
      { rating: 5, notes: "Crispy edges were insane", cooked_date: "2026-02-05" },
    ],
  },
  {
    title: "Fluffy Japanese Souffle Pancakes",
    description: "Cloud-like, jiggly pancakes with a delicate vanilla flavor. A showstopper breakfast.",
    instructions: "Separate eggs. Beat yolks with milk, vanilla, and oil.\nSift flour and baking powder into the yolk mixture and stir until just combined.\nBeat egg whites with cream of tartar until soft peaks form.\nGradually add sugar and beat to stiff, glossy peaks.\nFold one-third of the meringue into the batter to lighten it.\nGently fold in the remaining meringue in two additions.\nHeat a non-stick pan on the lowest heat setting.\nPipe or spoon batter into tall ring molds (or freeform).\nAdd a splash of water to the pan and cover. Cook 6-7 minutes.\nFlip carefully and cook another 5-6 minutes covered.\nServe immediately with butter, maple syrup, and fresh berries.",
    prep_time_minutes: 15,
    cook_time_minutes: 15,
    servings: 2,
    source_type: "manual" as const,
    image_url: IMAGES.pancakes,
    visibility: "public" as const,
    published_at: new Date().toISOString(),
    ingredients: [
      { ingredient_name: "Eggs", quantity: 3, unit: "", notes: "separated", order_index: 0 },
      { ingredient_name: "Milk", quantity: 40, unit: "ml", notes: "", order_index: 1 },
      { ingredient_name: "Vanilla extract", quantity: 1, unit: "tsp", notes: "", order_index: 2 },
      { ingredient_name: "Vegetable oil", quantity: 1, unit: "tbsp", notes: "", order_index: 3 },
      { ingredient_name: "All-purpose flour", quantity: 60, unit: "g", notes: "sifted", order_index: 4 },
      { ingredient_name: "Baking powder", quantity: 0.5, unit: "tsp", notes: "", order_index: 5 },
      { ingredient_name: "Cream of tartar", quantity: 0.25, unit: "tsp", notes: "", order_index: 6 },
      { ingredient_name: "Sugar", quantity: 30, unit: "g", notes: "", order_index: 7 },
      { ingredient_name: "Maple syrup", quantity: null, unit: "", notes: "for serving", order_index: 8 },
    ],
    tags: ["breakfast", "japanese", "pancakes", "sweet"],
    ratings: [
      { rating: 4, notes: "So fluffy! Took a few tries to get the meringue right", cooked_date: "2026-02-09" },
      { rating: 5, notes: "Absolutely magical, guests were amazed", cooked_date: "2026-02-14" },
    ],
  },
  {
    title: "Miso Ramen with Chashu Pork",
    description: "Rich miso broth with tender braised pork belly, soft-boiled egg, and all the toppings.",
    instructions: "For chashu: roll pork belly tightly and tie with kitchen twine.\nSear the roll in a hot pan on all sides.\nBraise in soy sauce, mirin, sake, sugar, and water for 2 hours on low.\nFor broth: saute garlic and ginger in sesame oil.\nAdd chicken stock and bring to a simmer.\nWhisk in white miso paste (do not boil after adding miso).\nCook ramen noodles according to package directions.\nSoft-boil eggs for 6.5 minutes, then peel and marinate in chashu braising liquid.\nAssemble: noodles in bowl, ladle broth over, slice chashu and arrange on top.\nAdd soft-boiled egg, corn, nori, green onions, and a drizzle of chili oil.",
    prep_time_minutes: 30,
    cook_time_minutes: 120,
    servings: 4,
    source_type: "url" as const,
    source_url: "https://www.seriouseats.com/miso-ramen-recipe",
    image_url: IMAGES.ramen,
    visibility: "public" as const,
    published_at: new Date().toISOString(),
    ingredients: [
      { ingredient_name: "Pork belly", quantity: 500, unit: "g", notes: "skin off", order_index: 0 },
      { ingredient_name: "Soy sauce", quantity: 100, unit: "ml", notes: "", order_index: 1 },
      { ingredient_name: "Mirin", quantity: 50, unit: "ml", notes: "", order_index: 2 },
      { ingredient_name: "White miso paste", quantity: 4, unit: "tbsp", notes: "", order_index: 3 },
      { ingredient_name: "Chicken stock", quantity: 1.5, unit: "L", notes: "", order_index: 4 },
      { ingredient_name: "Fresh ramen noodles", quantity: 400, unit: "g", notes: "", order_index: 5 },
      { ingredient_name: "Eggs", quantity: 4, unit: "", notes: "for soft-boiling", order_index: 6 },
      { ingredient_name: "Sweet corn", quantity: 100, unit: "g", notes: "", order_index: 7 },
      { ingredient_name: "Nori sheets", quantity: 4, unit: "", notes: "", order_index: 8 },
      { ingredient_name: "Green onions", quantity: 3, unit: "", notes: "sliced", order_index: 9 },
    ],
    tags: ["ramen", "japanese", "soup", "pork"],
    ratings: [
      { rating: 5, notes: "Worth every minute of the 2-hour braise", cooked_date: "2026-01-20" },
    ],
  },
  {
    title: "Mediterranean Grain Bowl",
    description: "A colorful bowl with farro, roasted vegetables, feta, and a lemon-herb dressing. Healthy and satisfying.",
    instructions: "Cook farro according to package directions and let cool slightly.\nPreheat oven to 200C/400F.\nToss chickpeas, zucchini, and bell pepper with olive oil, cumin, and paprika.\nRoast for 25 minutes until golden.\nMake dressing: whisk olive oil, lemon juice, garlic, oregano, salt, and pepper.\nAssemble bowls: farro base, roasted vegetables, cucumber, cherry tomatoes, olives.\nCrumble feta over the top.\nDrizzle with dressing and serve.",
    prep_time_minutes: 15,
    cook_time_minutes: 25,
    servings: 3,
    source_type: "manual" as const,
    image_url: IMAGES.salad,
    visibility: "public" as const,
    published_at: new Date().toISOString(),
    ingredients: [
      { ingredient_name: "Farro", quantity: 200, unit: "g", notes: "", order_index: 0 },
      { ingredient_name: "Chickpeas", quantity: 400, unit: "g", notes: "canned, drained", order_index: 1 },
      { ingredient_name: "Zucchini", quantity: 1, unit: "", notes: "diced", order_index: 2 },
      { ingredient_name: "Red bell pepper", quantity: 1, unit: "", notes: "diced", order_index: 3 },
      { ingredient_name: "Cherry tomatoes", quantity: 150, unit: "g", notes: "halved", order_index: 4 },
      { ingredient_name: "Cucumber", quantity: 1, unit: "", notes: "diced", order_index: 5 },
      { ingredient_name: "Feta cheese", quantity: 100, unit: "g", notes: "", order_index: 6 },
      { ingredient_name: "Kalamata olives", quantity: 50, unit: "g", notes: "", order_index: 7 },
      { ingredient_name: "Lemon", quantity: 1, unit: "", notes: "juiced", order_index: 8 },
    ],
    tags: ["healthy", "mediterranean", "vegetarian", "grain bowl"],
    ratings: [
      { rating: 4, notes: "Great meal prep option", cooked_date: "2026-02-01" },
      { rating: 4, notes: "Added grilled halloumi, even better", cooked_date: "2026-02-11" },
    ],
  },
  {
    title: "Chocolate Lava Cake",
    description: "Molten chocolate cake with a gooey center. Impressive but surprisingly easy. Perfect date night dessert.",
    instructions: "Preheat oven to 220C/425F. Butter and flour 4 ramekins.\nMelt chocolate and butter together in a double boiler or microwave.\nWhisk eggs and egg yolks with sugar until thick and pale.\nFold the chocolate mixture into the eggs.\nSift in flour and fold gently until just combined.\nDivide batter among ramekins.\nBake for exactly 12 minutes — edges should be set but center jiggly.\nLet cool 1 minute, then run a knife around the edge.\nInvert onto plates and serve immediately with a scoop of vanilla ice cream.",
    prep_time_minutes: 15,
    cook_time_minutes: 12,
    servings: 4,
    source_type: "manual" as const,
    image_url: IMAGES.cake,
    visibility: "private" as const,
    ingredients: [
      { ingredient_name: "Dark chocolate", quantity: 150, unit: "g", notes: "70% cocoa", order_index: 0 },
      { ingredient_name: "Unsalted butter", quantity: 100, unit: "g", notes: "plus extra for ramekins", order_index: 1 },
      { ingredient_name: "Eggs", quantity: 2, unit: "", notes: "", order_index: 2 },
      { ingredient_name: "Egg yolks", quantity: 2, unit: "", notes: "", order_index: 3 },
      { ingredient_name: "Sugar", quantity: 60, unit: "g", notes: "", order_index: 4 },
      { ingredient_name: "All-purpose flour", quantity: 30, unit: "g", notes: "sifted", order_index: 5 },
      { ingredient_name: "Vanilla ice cream", quantity: null, unit: "", notes: "for serving", order_index: 6 },
    ],
    tags: ["dessert", "chocolate", "french", "date night"],
    ratings: [
      { rating: 5, notes: "The lava center was perfect at exactly 12 minutes", cooked_date: "2026-02-14" },
    ],
  },
  {
    title: "Fresh Sushi Rolls (Maki)",
    description: "Homemade sushi with salmon, avocado, and cucumber. Once you get the rice right, it's easier than you think.",
    instructions: "Rinse sushi rice until water runs clear. Cook with 1:1 ratio of water.\nSeason cooked rice with rice vinegar, sugar, and salt while still warm. Fan to cool.\nPlace a nori sheet on a bamboo mat, shiny side down.\nSpread a thin, even layer of rice over the nori, leaving 2cm at the top.\nLay salmon, avocado, and cucumber strips in a line across the center.\nRoll tightly using the bamboo mat, pressing gently.\nSeal the edge with a bit of water.\nCut with a sharp, wet knife into 6-8 pieces.\nServe with soy sauce, pickled ginger, and wasabi.",
    prep_time_minutes: 30,
    cook_time_minutes: 20,
    servings: 4,
    source_type: "manual" as const,
    image_url: IMAGES.sushi,
    visibility: "public" as const,
    published_at: new Date().toISOString(),
    ingredients: [
      { ingredient_name: "Sushi rice", quantity: 300, unit: "g", notes: "", order_index: 0 },
      { ingredient_name: "Rice vinegar", quantity: 3, unit: "tbsp", notes: "", order_index: 1 },
      { ingredient_name: "Nori sheets", quantity: 6, unit: "", notes: "", order_index: 2 },
      { ingredient_name: "Sushi-grade salmon", quantity: 200, unit: "g", notes: "sliced into strips", order_index: 3 },
      { ingredient_name: "Avocado", quantity: 2, unit: "", notes: "sliced", order_index: 4 },
      { ingredient_name: "Cucumber", quantity: 1, unit: "", notes: "cut into matchsticks", order_index: 5 },
      { ingredient_name: "Soy sauce", quantity: null, unit: "", notes: "for serving", order_index: 6 },
      { ingredient_name: "Wasabi", quantity: null, unit: "", notes: "for serving", order_index: 7 },
    ],
    tags: ["sushi", "japanese", "seafood"],
    ratings: [],
  },
  {
    title: "Slow-Roasted Tomato Soup",
    description: "Deep, sweet flavor from oven-roasted tomatoes. Silky smooth with a touch of cream. Perfect with grilled cheese.",
    instructions: "Preheat oven to 180C/350F.\nHalve tomatoes and place cut-side up on a baking sheet.\nScatter garlic cloves (unpeeled) and onion wedges around the tomatoes.\nDrizzle with olive oil, season with salt and pepper.\nRoast for 45 minutes until tomatoes are soft and slightly charred.\nSqueeze garlic from skins into a blender with the tomatoes and onions.\nAdd vegetable stock and blend until smooth.\nTransfer to a pot and heat gently.\nStir in cream and season to taste.\nServe with crusty bread.",
    prep_time_minutes: 10,
    cook_time_minutes: 50,
    servings: 4,
    source_type: "manual" as const,
    image_url: IMAGES.soup,
    visibility: "private" as const,
    ingredients: [
      { ingredient_name: "Ripe tomatoes", quantity: 1, unit: "kg", notes: "", order_index: 0 },
      { ingredient_name: "Garlic", quantity: 6, unit: "cloves", notes: "unpeeled", order_index: 1 },
      { ingredient_name: "Yellow onion", quantity: 1, unit: "", notes: "quartered", order_index: 2 },
      { ingredient_name: "Olive oil", quantity: 3, unit: "tbsp", notes: "", order_index: 3 },
      { ingredient_name: "Vegetable stock", quantity: 300, unit: "ml", notes: "", order_index: 4 },
      { ingredient_name: "Heavy cream", quantity: 60, unit: "ml", notes: "", order_index: 5 },
    ],
    tags: ["soup", "vegetarian", "comfort food"],
    ratings: [
      { rating: 4, notes: "So much better than canned", cooked_date: "2026-01-18" },
    ],
  },
  {
    title: "Crispy Fish Tacos with Mango Salsa",
    description: "Beer-battered white fish in warm tortillas with a bright mango salsa and chipotle crema.",
    instructions: "Make mango salsa: combine diced mango, red onion, jalapeno, cilantro, lime juice, and a pinch of salt.\nMake chipotle crema: mix sour cream with minced chipotle in adobo and lime juice.\nMake batter: whisk flour, cornstarch, baking powder, salt, and cold beer until smooth.\nHeat oil to 190C/375F for deep frying.\nPat fish dry and dip in batter, letting excess drip off.\nFry for 3-4 minutes until golden and crispy. Drain on paper towels.\nWarm tortillas in a dry pan.\nAssemble: tortilla, shredded cabbage, crispy fish, mango salsa, chipotle crema.\nSqueeze fresh lime over everything.",
    prep_time_minutes: 20,
    cook_time_minutes: 15,
    servings: 4,
    source_type: "manual" as const,
    image_url: IMAGES.tacos,
    visibility: "public" as const,
    published_at: new Date().toISOString(),
    ingredients: [
      { ingredient_name: "White fish fillets", quantity: 500, unit: "g", notes: "cod or mahi-mahi", order_index: 0 },
      { ingredient_name: "All-purpose flour", quantity: 150, unit: "g", notes: "", order_index: 1 },
      { ingredient_name: "Cold beer", quantity: 200, unit: "ml", notes: "lager works best", order_index: 2 },
      { ingredient_name: "Corn tortillas", quantity: 12, unit: "", notes: "small", order_index: 3 },
      { ingredient_name: "Mango", quantity: 1, unit: "", notes: "diced", order_index: 4 },
      { ingredient_name: "Red cabbage", quantity: 150, unit: "g", notes: "shredded", order_index: 5 },
      { ingredient_name: "Sour cream", quantity: 100, unit: "ml", notes: "", order_index: 6 },
      { ingredient_name: "Chipotle in adobo", quantity: 1, unit: "tbsp", notes: "minced", order_index: 7 },
      { ingredient_name: "Lime", quantity: 2, unit: "", notes: "", order_index: 8 },
      { ingredient_name: "Fresh cilantro", quantity: 1, unit: "bunch", notes: "", order_index: 9 },
    ],
    tags: ["tacos", "mexican", "seafood", "fried"],
    ratings: [
      { rating: 5, notes: "The mango salsa makes it", cooked_date: "2026-02-07" },
      { rating: 4, notes: "Next time I'll make the batter thinner", cooked_date: "2026-01-25" },
    ],
  },
  {
    title: "Mushroom Risotto",
    description: "Creamy arborio rice with a mix of wild mushrooms, white wine, and plenty of parmesan. Patient stirring pays off.",
    instructions: "Heat stock in a saucepan and keep warm on low.\nSaute mixed mushrooms in butter until golden. Set aside.\nIn a heavy pan, sweat diced shallot in olive oil until soft.\nAdd arborio rice and stir for 1 minute until translucent.\nPour in white wine and stir until absorbed.\nAdd warm stock one ladle at a time, stirring frequently.\nContinue adding stock and stirring for about 18-20 minutes.\nRice should be creamy but still al dente.\nFold in the mushrooms, parmesan, and a knob of butter.\nSeason with salt and pepper. Serve immediately.",
    prep_time_minutes: 10,
    cook_time_minutes: 30,
    servings: 4,
    source_type: "manual" as const,
    image_url: IMAGES.risotto,
    visibility: "public" as const,
    published_at: new Date().toISOString(),
    ingredients: [
      { ingredient_name: "Arborio rice", quantity: 300, unit: "g", notes: "", order_index: 0 },
      { ingredient_name: "Mixed mushrooms", quantity: 300, unit: "g", notes: "shiitake, oyster, cremini", order_index: 1 },
      { ingredient_name: "Chicken or vegetable stock", quantity: 1, unit: "L", notes: "warm", order_index: 2 },
      { ingredient_name: "Dry white wine", quantity: 150, unit: "ml", notes: "", order_index: 3 },
      { ingredient_name: "Shallot", quantity: 1, unit: "", notes: "finely diced", order_index: 4 },
      { ingredient_name: "Parmesan", quantity: 80, unit: "g", notes: "grated", order_index: 5 },
      { ingredient_name: "Butter", quantity: 40, unit: "g", notes: "", order_index: 6 },
    ],
    tags: ["risotto", "italian", "mushroom", "vegetarian"],
    ratings: [
      { rating: 5, notes: "Restaurant quality", cooked_date: "2026-02-13" },
    ],
  },
  {
    title: "Sourdough Bread",
    description: "Crusty artisan loaf with an open crumb and complex flavor. Requires a mature sourdough starter.",
    instructions: "Mix flour, water, and active starter. Autolyse for 30 minutes.\nAdd salt and fold in until incorporated.\nPerform stretch and folds every 30 minutes for the first 2 hours.\nBulk ferment at room temperature for 4-5 hours total (until doubled).\nShape the dough into a round boule.\nPlace seam-side up in a floured banneton.\nCold retard in the fridge for 12-16 hours.\nPreheat oven to 250C/480F with a Dutch oven inside.\nScore the dough and transfer to the hot Dutch oven.\nBake covered for 20 minutes, then uncovered for 25 minutes until deep golden.\nCool completely on a wire rack before slicing.",
    prep_time_minutes: 30,
    cook_time_minutes: 45,
    servings: 1,
    source_type: "manual" as const,
    image_url: IMAGES.bread,
    visibility: "private" as const,
    ingredients: [
      { ingredient_name: "Bread flour", quantity: 450, unit: "g", notes: "", order_index: 0 },
      { ingredient_name: "Whole wheat flour", quantity: 50, unit: "g", notes: "", order_index: 1 },
      { ingredient_name: "Water", quantity: 350, unit: "g", notes: "room temperature", order_index: 2 },
      { ingredient_name: "Sourdough starter", quantity: 100, unit: "g", notes: "active, bubbly", order_index: 3 },
      { ingredient_name: "Salt", quantity: 10, unit: "g", notes: "", order_index: 4 },
    ],
    tags: ["bread", "sourdough", "baking"],
    ratings: [],
  },
  {
    title: "Grilled Ribeye with Herb Butter",
    description: "A perfectly seared ribeye steak finished with compound butter. Simple technique, extraordinary result.",
    instructions: "Take steak out of the fridge 45 minutes before cooking.\nMake herb butter: mix softened butter with minced garlic, rosemary, thyme, and parsley.\nRoll into a log in plastic wrap and refrigerate.\nPat steak completely dry and season generously with salt and pepper.\nHeat a cast iron skillet or grill to very high heat.\nCook steak 4 minutes per side for medium-rare (adjust for thickness).\nRest for 5 minutes on a cutting board.\nTop with a thick slice of herb butter.\nServe with your favorite sides.",
    prep_time_minutes: 50,
    cook_time_minutes: 10,
    servings: 2,
    source_type: "manual" as const,
    image_url: IMAGES.steak,
    visibility: "public" as const,
    published_at: new Date().toISOString(),
    ingredients: [
      { ingredient_name: "Ribeye steak", quantity: 2, unit: "", notes: "2.5cm thick, room temperature", order_index: 0 },
      { ingredient_name: "Unsalted butter", quantity: 80, unit: "g", notes: "softened", order_index: 1 },
      { ingredient_name: "Fresh rosemary", quantity: 1, unit: "tbsp", notes: "minced", order_index: 2 },
      { ingredient_name: "Fresh thyme", quantity: 1, unit: "tbsp", notes: "minced", order_index: 3 },
      { ingredient_name: "Garlic", quantity: 2, unit: "cloves", notes: "minced", order_index: 4 },
      { ingredient_name: "Flaky sea salt", quantity: null, unit: "", notes: "", order_index: 5 },
      { ingredient_name: "Black pepper", quantity: null, unit: "", notes: "freshly cracked", order_index: 6 },
    ],
    tags: ["steak", "grilling", "date night"],
    ratings: [
      { rating: 5, notes: "The herb butter is incredible on a hot steak", cooked_date: "2026-02-06" },
      { rating: 5, notes: null, cooked_date: "2026-02-14" },
    ],
  },
  {
    title: "Berry Smoothie Bowl",
    description: "Thick, vibrant smoothie bowl topped with granola, fresh fruit, and a drizzle of honey. Quick healthy breakfast.",
    instructions: "Blend frozen berries, banana, yogurt, and a splash of milk until very thick.\nThe consistency should be thicker than a regular smoothie.\nPour into a bowl.\nTop with sliced banana, fresh berries, granola, coconut flakes, and chia seeds.\nDrizzle with honey.\nServe immediately.",
    prep_time_minutes: 5,
    cook_time_minutes: 0,
    servings: 1,
    source_type: "instagram" as const,
    source_url: "https://www.instagram.com/p/example",
    image_url: IMAGES.smoothie,
    visibility: "private" as const,
    ingredients: [
      { ingredient_name: "Frozen mixed berries", quantity: 150, unit: "g", notes: "", order_index: 0 },
      { ingredient_name: "Banana", quantity: 1, unit: "", notes: "frozen", order_index: 1 },
      { ingredient_name: "Greek yogurt", quantity: 100, unit: "g", notes: "", order_index: 2 },
      { ingredient_name: "Milk", quantity: 50, unit: "ml", notes: "any kind", order_index: 3 },
      { ingredient_name: "Granola", quantity: 30, unit: "g", notes: "for topping", order_index: 4 },
      { ingredient_name: "Chia seeds", quantity: 1, unit: "tbsp", notes: "", order_index: 5 },
      { ingredient_name: "Honey", quantity: 1, unit: "tbsp", notes: "for drizzle", order_index: 6 },
    ],
    tags: ["breakfast", "healthy", "smoothie", "quick"],
    ratings: [
      { rating: 4, notes: "Add more banana for a sweeter bowl", cooked_date: "2026-02-03" },
    ],
  },
];

// ── Main ─────────────────────────────────────────────────────────────
async function seed() {
  const email = process.argv[2];
  const password = process.argv[3];

  if (!email || !password) {
    console.error("Usage: npx tsx scripts/seed.ts <email> <password>");
    process.exit(1);
  }

  console.log(`Signing in as ${email}...`);
  const { data: auth, error: authError } = await supabase.auth.signInWithPassword({ email, password });
  if (authError || !auth.user) {
    console.error("Auth failed:", authError?.message);
    process.exit(1);
  }

  const userId = auth.user.id;
  console.log(`Authenticated as ${userId}\n`);

  let created = 0;
  let skipped = 0;

  for (const recipe of RECIPES) {
    // Check if recipe already exists (by title)
    const { data: existing } = await supabase
      .from("recipes")
      .select("id")
      .eq("title", recipe.title)
      .eq("created_by", userId)
      .limit(1);

    if (existing && existing.length > 0) {
      console.log(`  SKIP "${recipe.title}" (already exists)`);
      skipped++;
      continue;
    }

    // Insert recipe (image_url set separately to avoid schema cache issues)
    const recipeRow: Record<string, unknown> = {
      title: recipe.title,
      description: recipe.description,
      instructions: recipe.instructions,
      prep_time_minutes: recipe.prep_time_minutes,
      cook_time_minutes: recipe.cook_time_minutes,
      servings: recipe.servings,
      source_type: recipe.source_type,
      source_url: (recipe as any).source_url || null,
      visibility: recipe.visibility,
      published_at: (recipe as any).published_at || null,
      created_by: userId,
    };

    const { data: inserted, error: recipeError } = await supabase
      .from("recipes")
      .insert(recipeRow)
      .select("id")
      .single();

    if (!recipeError && inserted && recipe.image_url) {
      // Update image_url — use fetch directly to bypass schema cache
      const { data: { session } } = await supabase.auth.getSession();
      const patchRes = await fetch(
        `${SUPABASE_URL}/rest/v1/recipes?id=eq.${inserted.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": `Bearer ${session!.access_token}`,
            "Prefer": "return=minimal",
          },
          body: JSON.stringify({ image_url: recipe.image_url }),
        }
      );
      if (!patchRes.ok) {
        console.log(`  WARN Could not set image_url for "${recipe.title}": ${patchRes.status}`);
      }
    }

    if (recipeError || !inserted) {
      console.error(`  FAIL "${recipe.title}":`, recipeError?.message);
      continue;
    }

    // Insert ingredients
    if (recipe.ingredients.length > 0) {
      await supabase.from("recipe_ingredients").insert(
        recipe.ingredients.map((ing) => ({
          recipe_id: inserted.id,
          ...ing,
        }))
      );
    }

    // Insert tags
    if (recipe.tags.length > 0) {
      await supabase.from("recipe_tags").insert(
        recipe.tags.map((tag) => ({
          recipe_id: inserted.id,
          tag,
        }))
      );
    }

    // Insert ratings
    if (recipe.ratings.length > 0) {
      await supabase.from("recipe_ratings").insert(
        recipe.ratings.map((r) => ({
          recipe_id: inserted.id,
          user_id: userId,
          rating: r.rating,
          notes: r.notes,
          cooked_date: r.cooked_date,
        }))
      );
    }

    console.log(`  OK   "${recipe.title}" (${recipe.ingredients.length} ingredients, ${recipe.tags.length} tags, ${recipe.ratings.length} ratings)`);
    created++;
  }

  console.log(`\nDone! Created ${created}, skipped ${skipped}.`);
  process.exit(0);
}

seed();
