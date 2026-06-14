WITH email_stats AS (
  SELECT
    count(*) AS users_with_email,
    count(DISTINCT lower("email")) AS email_groups
  FROM "users"
  WHERE "email" IS NOT NULL
),
eligible_users AS (
  SELECT users."id"
  FROM "users" users
  CROSS JOIN email_stats
  WHERE users."email" IS NOT NULL
    AND email_stats.users_with_email > 0
    AND email_stats.email_groups = 1
),
orphan_farms AS (
  SELECT farms."id"
  FROM "farms" farms
  WHERE NOT EXISTS (
    SELECT 1
    FROM "farm_members" farm_members
    WHERE farm_members."farm_id" = farms."id"
  )
)
INSERT INTO "farm_members" ("farm_id", "user_id", "role")
SELECT orphan_farms."id", eligible_users."id", 'owner'
FROM orphan_farms
CROSS JOIN eligible_users
ON CONFLICT ("farm_id", "user_id") DO NOTHING;
