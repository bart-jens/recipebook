## 1. Database

- [x] 1.1 Update `get_chef_profile` RPC: add visibility filter to Activity tab query (`r.visibility = 'public' OR r.created_by = v_caller_id`)
- [x] 1.2 Update `get_chef_profile` RPC: add visibility filter to Favorites tab query (same filter)

## 2. Recipe Detail — Private Recipe Message

- [x] 2.1 Web: update recipe detail 404 to show "This recipe is private" when recipe exists but is inaccessible
- [x] 2.2 Mobile: update recipe detail "not found" state to show "This recipe is private" when recipe exists but is inaccessible
