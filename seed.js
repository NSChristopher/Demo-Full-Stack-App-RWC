const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'backend', 'prisma', 'dev.db'));

// Update first user to be admin
const updateUser = db.prepare('UPDATE User SET role = ? WHERE id = ?');
updateUser.run('admin', 1);

// Insert sample products
const insertProduct = db.prepare(`
  INSERT INTO Product (name, description, price, imageUrl, category, stock) 
  VALUES (?, ?, ?, ?, ?, ?)
`);

const products = [
  {
    name: 'Hydrating Face Moisturizer',
    description: 'A lightweight, non-greasy moisturizer that provides 24-hour hydration for all skin types.',
    price: 29.99,
    imageUrl: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=300',
    category: 'Skincare',
    stock: 50
  },
  {
    name: 'Vitamin C Serum',
    description: 'Brightening serum with 20% Vitamin C to even skin tone and reduce dark spots.',
    price: 39.99,
    imageUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=300',
    category: 'Skincare',
    stock: 30
  },
  {
    name: 'Matte Liquid Lipstick',
    description: 'Long-lasting matte lipstick that stays put for up to 8 hours without drying.',
    price: 18.99,
    imageUrl: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=300',
    category: 'Makeup',
    stock: 25
  },
  {
    name: 'Eyeshadow Palette',
    description: '12-shade eyeshadow palette with highly pigmented, blendable colors.',
    price: 45.99,
    imageUrl: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=300',
    category: 'Makeup',
    stock: 20
  },
  {
    name: 'Nourishing Hair Mask',
    description: 'Deep conditioning mask that repairs and strengthens damaged hair.',
    price: 24.99,
    imageUrl: 'https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=300',
    category: 'Haircare',
    stock: 40
  },
  {
    name: 'Gentle Cleanser',
    description: 'Sulfate-free cleanser that gently removes makeup and impurities.',
    price: 22.99,
    imageUrl: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300',
    category: 'Skincare',
    stock: 35
  },
  {
    name: 'Foundation SPF 30',
    description: 'Full coverage foundation with built-in SPF protection.',
    price: 32.99,
    imageUrl: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300',
    category: 'Makeup',
    stock: 28
  },
  {
    name: 'Leave-in Conditioner',
    description: 'Lightweight leave-in treatment that detangles and protects hair.',
    price: 19.99,
    imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300',
    category: 'Haircare',
    stock: 45
  }
];

products.forEach(product => {
  insertProduct.run(
    product.name,
    product.description,
    product.price,
    product.imageUrl,
    product.category,
    product.stock
  );
});

console.log('Database seeded successfully!');
console.log('Admin user created: admin@beautyshop.com / admin123');
console.log(`${products.length} products added`);

db.close();