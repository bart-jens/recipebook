export const queryKeys = {
  recipes: (userId: string, search: string) =>
    ['recipes', userId, search] as const,
  recipeDetail: (id: string, userId: string | undefined) =>
    ['recipe', id, userId] as const,
  feed: (userId: string) =>
    ['feed', userId] as const,
  discover: (userId: string, search: string) =>
    ['discover', userId, search] as const,
};
