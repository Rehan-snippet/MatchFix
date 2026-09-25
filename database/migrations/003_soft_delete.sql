-- ============================================================
-- Migration 003: Soft delete for turfs and products
-- ============================================================

ALTER TABLE turfs ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_turfs_active ON turfs(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active) WHERE is_active = TRUE;
