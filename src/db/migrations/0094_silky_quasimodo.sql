UPDATE "apikey" SET "remaining" = 1000, "refill_amount" = 1000, "refill_interval" = 3600000
WHERE "config_id" = 'standard' AND "refill_interval" IS NULL AND "rate_limit_enabled" IS NOT FALSE;
