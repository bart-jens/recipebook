-- Fix get_chef_profile: Activity and Favorites tabs leak private recipes.
-- Both tabs query recipes via SECURITY DEFINER (bypasses RLS) but don't
-- filter by visibility. Add filter: only show public recipes or recipes
-- owned by the caller.

create or replace function public.get_chef_profile(p_chef_id uuid)
returns jsonb
language plpgsql
stable
security definer
as $$
declare
  v_caller_id uuid := auth.uid();
  v_profile record;
  v_is_owner boolean;
  v_is_follower boolean;
  v_can_view boolean;
  v_result jsonb;
  v_stats jsonb;
  v_activity jsonb;
  v_favorites jsonb;
  v_published jsonb;
  v_recommendations jsonb;
begin
  -- Fetch profile
  select id, display_name, bio, is_private, avatar_url
  into v_profile
  from public.user_profiles
  where id = p_chef_id;

  if v_profile is null then
    raise exception 'User not found';
  end if;

  v_is_owner := (v_caller_id = p_chef_id);

  -- Check follow status
  v_is_follower := exists (
    select 1 from public.user_follows
    where follower_id = v_caller_id and following_id = p_chef_id
  );

  -- Can view tab data if: owner, follower, or public profile
  v_can_view := v_is_owner or v_is_follower or not v_profile.is_private;

  -- Stats
  select jsonb_build_object(
    'recipe_count', (select count(*) from public.recipes where created_by = p_chef_id),
    'cook_count', (select count(*) from public.cook_log where user_id = p_chef_id),
    'follower_count', (select count(*) from public.user_follows where following_id = p_chef_id),
    'following_count', (select count(*) from public.user_follows where follower_id = p_chef_id)
  ) into v_stats;

  -- Tab data (only if allowed)
  if v_can_view then
    -- Activity: recent cook_log entries (last 20)
    -- Only show entries for public recipes or recipes the caller owns
    select coalesce(jsonb_agg(row_to_json(t)::jsonb order by t.cooked_at desc), '[]'::jsonb)
    into v_activity
    from (
      select cl.recipe_id, cl.cooked_at, cl.notes, r.title as recipe_title, r.image_url as recipe_image_url
      from public.cook_log cl
      join public.recipes r on r.id = cl.recipe_id
      where cl.user_id = p_chef_id
        and (r.visibility = 'public' or r.created_by = v_caller_id)
      order by cl.cooked_at desc
      limit 20
    ) t;

    -- Favorites: recipe_favorites with rating
    -- Only show favorites for public recipes or recipes the caller owns
    select coalesce(jsonb_agg(row_to_json(t)::jsonb order by t.favorited_at desc), '[]'::jsonb)
    into v_favorites
    from (
      select rf.recipe_id, rf.created_at as favorited_at,
             r.title as recipe_title, r.image_url as recipe_image_url,
             rr.rating
      from public.recipe_favorites rf
      join public.recipes r on r.id = rf.recipe_id
      left join public.recipe_ratings rr on rr.recipe_id = rf.recipe_id and rr.user_id = p_chef_id
      where rf.user_id = p_chef_id
        and (r.visibility = 'public' or r.created_by = v_caller_id)
      order by rf.created_at desc
    ) t;

    -- Published: public recipes
    select coalesce(jsonb_agg(row_to_json(t)::jsonb order by t.published_at desc), '[]'::jsonb)
    into v_published
    from (
      select r.id, r.title, r.description, r.image_url, r.prep_time_minutes, r.cook_time_minutes, r.published_at
      from public.recipes r
      where r.created_by = p_chef_id and r.visibility = 'public'
      order by r.published_at desc
    ) t;

    -- Recommendations: recipe_share_cards
    select coalesce(jsonb_agg(row_to_json(t)::jsonb order by t.shared_at desc), '[]'::jsonb)
    into v_recommendations
    from (
      select share_id, recipe_id, share_notes, shared_at, title,
             source_url, source_name, source_type, image_url, tags, user_rating
      from public.recipe_share_cards
      where user_id = p_chef_id
      order by shared_at desc
    ) t;
  else
    v_activity := '[]'::jsonb;
    v_favorites := '[]'::jsonb;
    v_published := '[]'::jsonb;
    v_recommendations := '[]'::jsonb;
  end if;

  -- Build result
  v_result := jsonb_build_object(
    'profile', jsonb_build_object(
      'id', v_profile.id,
      'display_name', v_profile.display_name,
      'bio', v_profile.bio,
      'is_private', v_profile.is_private,
      'avatar_url', v_profile.avatar_url
    ),
    'stats', v_stats,
    'is_following', v_is_follower,
    'is_owner', v_is_owner,
    'can_view', v_can_view,
    'activity', v_activity,
    'favorites', v_favorites,
    'published', v_published,
    'recommendations', v_recommendations
  );

  return v_result;
end;
$$;
