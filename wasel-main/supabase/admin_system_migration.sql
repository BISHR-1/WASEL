/**
 * Supabase Migration for Admin System
 * Create tables for admin users, orders, and order assignments
 */

-- Create admin_users table
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'supervisor', 'delivery_person', 'supplier')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create orders table (if not exists)
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'assigned', 'in_progress', 'completed', 'cancelled')),
  total_amount DECIMAL(10, 2),
  currency VARCHAR(3) DEFAULT 'USD',
  sender_details JSONB,
  recipient_details JSONB,
  payment_method VARCHAR(50),
  notes TEXT,
  delivery_time TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create order_assignments table
CREATE TABLE IF NOT EXISTS order_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  delivery_person_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES admin_users(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed', 'failed')),
  assigned_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_admin_users_email ON admin_users(email);
CREATE INDEX idx_admin_users_role ON admin_users(role);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_user_email ON orders(user_email);
CREATE INDEX idx_order_assignments_delivery_person ON order_assignments(delivery_person_id);
CREATE INDEX idx_order_assignments_order ON order_assignments(order_id);
CREATE INDEX idx_order_assignments_status ON order_assignments(status);

-- Enable RLS (Row Level Security)
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_assignments ENABLE ROW LEVEL SECURITY;

-- Create policies for admin_users
CREATE POLICY "Allow read all admin users" ON admin_users
  FOR SELECT
  USING (true);

CREATE POLICY "Allow insert for authenticated users" ON admin_users
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow update own profile" ON admin_users
  FOR UPDATE
  USING (auth.uid()::text = id::text)
  WITH CHECK (auth.uid()::text = id::text);

-- Create policies for orders
CREATE POLICY "Allow read orders" ON orders
  FOR SELECT
  USING (
    auth.role() = 'authenticated' OR 
    user_email = current_user_email()
  );

CREATE POLICY "Allow insert orders" ON orders
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow update orders" ON orders
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Create policies for order_assignments
CREATE POLICY "Allow read assignments for delivery person" ON order_assignments
  FOR SELECT
  USING (
    delivery_person_id::text = auth.uid()::text OR
    assigned_by::text = auth.uid()::text
  );

CREATE POLICY "Allow insert and update assignments" ON order_assignments
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow update assignments for supervisors" ON order_assignments
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
