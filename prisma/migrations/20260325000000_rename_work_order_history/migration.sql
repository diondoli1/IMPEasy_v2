-- Rename work_order_history to work_order_histories (Prisma expects work_order_histories)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'work_order_history'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'work_order_histories'
  ) THEN
    ALTER TABLE "work_order_history" RENAME TO "work_order_histories";
  END IF;
END $$;
