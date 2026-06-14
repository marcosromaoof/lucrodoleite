INSERT INTO "farm_members" ("farm_id", "user_id", "role")
SELECT
  source_memberships."farm_id",
  target_users."id" AS "user_id",
  CASE
    WHEN bool_or(source_memberships."role" = 'owner') THEN 'owner'
    ELSE min(source_memberships."role")
  END AS "role"
FROM "users" target_users
INNER JOIN "users" source_users
  ON lower(target_users."email") = lower(source_users."email")
  AND target_users."id" <> source_users."id"
INNER JOIN "farm_members" source_memberships
  ON source_memberships."user_id" = source_users."id"
WHERE target_users."email" IS NOT NULL
  AND source_users."email" IS NOT NULL
GROUP BY source_memberships."farm_id", target_users."id"
ON CONFLICT ("farm_id", "user_id") DO NOTHING;
