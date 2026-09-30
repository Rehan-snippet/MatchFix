-- ============================================================
-- Migration 007: Approval System for Organizers, Sellers, Turfs, and Products
-- ============================================================

-- 1. Organizers approval status
ALTER TABLE organizers ADD COLUMN IF NOT EXISTS approval_status 
  VARCHAR(20) NOT NULL DEFAULT 'pending' 
  CHECK (approval_status IN ('pending', 'approved', 'rejected'));

-- 2. Sellers approval status
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS approval_status 
  VARCHAR(20) NOT NULL DEFAULT 'pending' 
  CHECK (approval_status IN ('pending', 'approved', 'rejected'));

-- 3. Turfs approval status & rejection reason
ALTER TABLE turfs ADD COLUMN IF NOT EXISTS approval_status 
  VARCHAR(20) NOT NULL DEFAULT 'pending' 
  CHECK (approval_status IN ('pending', 'approved', 'rejected'));

ALTER TABLE turfs ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- 4. Products approval status & rejection reason
ALTER TABLE products ADD COLUMN IF NOT EXISTS approval_status 
  VARCHAR(20) NOT NULL DEFAULT 'pending' 
  CHECK (approval_status IN ('pending', 'approved', 'rejected'));

ALTER TABLE products ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- 5. Mark existing seeded records as approved so existing tests/features continue working
UPDATE organizers SET approval_status = 'approved' WHERE approval_status = 'pending';
UPDATE sellers SET approval_status = 'approved' WHERE approval_status = 'pending';
UPDATE turfs SET approval_status = 'approved' WHERE approval_status = 'pending';
UPDATE products SET approval_status = 'approved' WHERE approval_status = 'pending';

-- 6. Indexes for performant filtering
CREATE INDEX IF NOT EXISTS idx_organizers_approval ON organizers(approval_status);
CREATE INDEX IF NOT EXISTS idx_sellers_approval ON sellers(approval_status);
CREATE INDEX IF NOT EXISTS idx_turfs_approval ON turfs(approval_status);
CREATE INDEX IF NOT EXISTS idx_products_approval ON products(approval_status);
