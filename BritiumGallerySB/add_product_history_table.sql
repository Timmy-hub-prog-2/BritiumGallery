-- Add Product History Table
CREATE TABLE IF NOT EXISTS product_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT NOT NULL,
    admin_id BIGINT NOT NULL,
    action VARCHAR(50) NOT NULL,
    field_name VARCHAR(100),
    old_value TEXT,
    new_value TEXT,
    variant_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_product_id (product_id),
    INDEX idx_admin_id (admin_id),
    INDEX idx_variant_id (variant_id),
    INDEX idx_created_at (created_at)
);

-- Add foreign key constraints if they don't exist
-- Note: These should be added after ensuring the referenced tables exist
-- ALTER TABLE product_history ADD CONSTRAINT fk_product_history_product_id FOREIGN KEY (product_id) REFERENCES product(id);
-- ALTER TABLE product_history ADD CONSTRAINT fk_product_history_admin_id FOREIGN KEY (admin_id) REFERENCES user(id);
-- ALTER TABLE product_history ADD CONSTRAINT fk_product_history_variant_id FOREIGN KEY (variant_id) REFERENCES ProductVariant(id); 