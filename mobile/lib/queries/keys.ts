export const queryKeys = {
  recipes: (userId: string) =>
    ['recipes', userId] as const,
  ingredientSearch: (userId: string, search: string) =>
    ['ingredient-search', userId, search] as const,
  recipeDetail: (id: string, userId: string | undefined) =>
    ['recipe', id, userId] as const,
  feed: (userId: string) =>
    ['feed', userId] as const,
  discover: (userId: string, search: string) =>
    ['discover', userId, search] as const,
};
