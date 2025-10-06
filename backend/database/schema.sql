-- KV Garage Wholesale Platform Database Schema
-- PostgreSQL Database Setup

-- Create database (run this separately)
-- CREATE DATABASE kv_garage_wholesale;

-- Connect to the database and run the following:

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Packs table - stores the main pack information
CREATE TABLE packs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('starter', 'reseller', 'pro')),
    price DECIMAL(10,2) NOT NULL,
    deposit_price DECIMAL(10,2) NOT NULL,
    units INTEGER NOT NULL,
    resale_estimate DECIMAL(10,2),
    description TEXT,
    short_description VARCHAR(500),
    image VARCHAR(500),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'sold_out')),
    available_quantity INTEGER DEFAULT 0,
    reserved_quantity INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Manifests table - stores individual items within each pack
CREATE TABLE manifests (
    id SERIAL PRIMARY KEY,
    pack_id INTEGER NOT NULL REFERENCES packs(id) ON DELETE CASCADE,
    sku VARCHAR(100) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL,
    condition_grade VARCHAR(1) DEFAULT 'A' CHECK (condition_grade IN ('A', 'B', 'C')),
    description TEXT,
    image VARCHAR(500),
    estimated_value DECIMAL(8,2),
    category VARCHAR(100),
    brand VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders table - stores customer orders
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(20) UNIQUE NOT NULL,
    pack_id INTEGER NOT NULL REFERENCES packs(id),
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20),
    business_name VARCHAR(255),
    business_address TEXT,
    payment_type VARCHAR(20) NOT NULL CHECK (payment_type IN ('full', 'deposit')),
    amount DECIMAL(10,2) NOT NULL,
    deposit_amount DECIMAL(10,2) DEFAULT 0,
    remaining_amount DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'deposit_paid', 'shipped', 'completed', 'cancelled')),
    stripe_session_id VARCHAR(255),
    stripe_payment_intent_id VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inventory log table - tracks all inventory changes
CREATE TABLE inventory_log (
    id SERIAL PRIMARY KEY,
    pack_id INTEGER NOT NULL REFERENCES packs(id),
    action VARCHAR(20) NOT NULL CHECK (action IN ('reserve', 'release', 'sell', 'restock')),
    quantity INTEGER NOT NULL,
    order_id INTEGER REFERENCES orders(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Admin users table - for admin panel access
CREATE TABLE admin_users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Custom pack requests table - for custom pack requests
CREATE TABLE custom_pack_requests (
    id SERIAL PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20),
    business_name VARCHAR(255),
    request_description TEXT NOT NULL,
    estimated_budget DECIMAL(10,2),
    preferred_categories TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'quoted', 'accepted', 'rejected')),
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_packs_status ON packs(status);
CREATE INDEX idx_packs_type ON packs(type);
CREATE INDEX idx_packs_slug ON packs(slug);
CREATE INDEX idx_manifests_pack_id ON manifests(pack_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_customer_email ON orders(customer_email);
CREATE INDEX idx_inventory_log_pack_id ON inventory_log(pack_id);
CREATE INDEX idx_inventory_log_created_at ON inventory_log(created_at);
CREATE INDEX idx_custom_requests_status ON custom_pack_requests(status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_packs_updated_at BEFORE UPDATE ON packs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_custom_requests_updated_at BEFORE UPDATE ON custom_pack_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
