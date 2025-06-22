const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

// Simple SQLite database initialization
const db = new Database(path.join(__dirname, 'prisma', 'dev.db'));

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS User (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'customer',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS Post (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT,
    published INTEGER DEFAULT 0,
    authorId INTEGER NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (authorId) REFERENCES User(id)
  );

  CREATE TABLE IF NOT EXISTS Product (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    imageUrl TEXT,
    category TEXT NOT NULL,
    stock INTEGER DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS CartItem (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    productId INTEGER NOT NULL,
    quantity INTEGER DEFAULT 1,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
    FOREIGN KEY (productId) REFERENCES Product(id) ON DELETE CASCADE,
    UNIQUE(userId, productId)
  );

  CREATE TABLE IF NOT EXISTS "Order" (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    total REAL NOT NULL,
    status TEXT DEFAULT 'pending',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES User(id)
  );

  CREATE TABLE IF NOT EXISTS OrderItem (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    orderId INTEGER NOT NULL,
    productId INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    price REAL NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (orderId) REFERENCES "Order"(id) ON DELETE CASCADE,
    FOREIGN KEY (productId) REFERENCES Product(id)
  );
`);

// Simple ORM-like interface
const createUser = db.prepare(`
  INSERT INTO User (email, username, password, role) 
  VALUES (?, ?, ?, ?)
`);

const findUserByEmail = db.prepare(`
  SELECT * FROM User WHERE email = ?
`);

const findUserById = db.prepare(`
  SELECT * FROM User WHERE id = ?
`);

const createPost = db.prepare(`
  INSERT INTO Post (title, content, published, authorId) 
  VALUES (?, ?, ?, ?)
`);

const findAllPosts = db.prepare(`
  SELECT p.*, u.username, u.email 
  FROM Post p 
  JOIN User u ON p.authorId = u.id 
  ORDER BY p.createdAt DESC
`);

const findPostById = db.prepare(`
  SELECT p.*, u.username, u.email 
  FROM Post p 
  JOIN User u ON p.authorId = u.id 
  WHERE p.id = ?
`);

const updatePost = db.prepare(`
  UPDATE Post 
  SET title = ?, content = ?, published = ?, updatedAt = CURRENT_TIMESTAMP 
  WHERE id = ?
`);

const deletePost = db.prepare(`
  DELETE FROM Post WHERE id = ?
`);

// Product queries
const createProduct = db.prepare(`
  INSERT INTO Product (name, description, price, imageUrl, category, stock) 
  VALUES (?, ?, ?, ?, ?, ?)
`);

const findAllProducts = db.prepare(`
  SELECT * FROM Product ORDER BY createdAt DESC
`);

const findProductById = db.prepare(`
  SELECT * FROM Product WHERE id = ?
`);

const findProductsByCategory = db.prepare(`
  SELECT * FROM Product WHERE category = ? ORDER BY createdAt DESC
`);

const searchProducts = db.prepare(`
  SELECT * FROM Product 
  WHERE name LIKE ? OR description LIKE ? 
  ORDER BY createdAt DESC
`);

const updateProduct = db.prepare(`
  UPDATE Product 
  SET name = ?, description = ?, price = ?, imageUrl = ?, category = ?, stock = ?, updatedAt = CURRENT_TIMESTAMP 
  WHERE id = ?
`);

const deleteProduct = db.prepare(`
  DELETE FROM Product WHERE id = ?
`);

const getCategories = db.prepare(`
  SELECT DISTINCT category FROM Product WHERE category IS NOT NULL AND category != ''
`);

// Cart queries
const createCartItem = db.prepare(`
  INSERT INTO CartItem (userId, productId, quantity) 
  VALUES (?, ?, ?)
`);

const findCartByUserId = db.prepare(`
  SELECT c.*, p.name, p.description, p.price, p.imageUrl, p.category, p.stock
  FROM CartItem c
  JOIN Product p ON c.productId = p.id
  WHERE c.userId = ?
  ORDER BY c.createdAt DESC
`);

const findCartItem = db.prepare(`
  SELECT * FROM CartItem WHERE userId = ? AND productId = ?
`);

const findCartItemById = db.prepare(`
  SELECT c.*, p.name, p.description, p.price, p.imageUrl, p.category, p.stock
  FROM CartItem c
  JOIN Product p ON c.productId = p.id
  WHERE c.id = ?
`);

const updateCartItemQuantity = db.prepare(`
  UPDATE CartItem 
  SET quantity = ?, updatedAt = CURRENT_TIMESTAMP 
  WHERE id = ?
`);

const deleteCartItem = db.prepare(`
  DELETE FROM CartItem WHERE id = ?
`);

const deleteAllCartItems = db.prepare(`
  DELETE FROM CartItem WHERE userId = ?
`);

// Order queries
const createOrder = db.prepare(`
  INSERT INTO "Order" (userId, total, status) 
  VALUES (?, ?, ?)
`);

const createOrderItem = db.prepare(`
  INSERT INTO OrderItem (orderId, productId, quantity, price) 
  VALUES (?, ?, ?, ?)
`);

const findOrdersByUserId = db.prepare(`
  SELECT * FROM "Order" WHERE userId = ? ORDER BY createdAt DESC
`);

const findOrderById = db.prepare(`
  SELECT * FROM "Order" WHERE id = ?
`);

const findOrderItemsByOrderId = db.prepare(`
  SELECT oi.*, p.name, p.description, p.imageUrl, p.category
  FROM OrderItem oi
  JOIN Product p ON oi.productId = p.id
  WHERE oi.orderId = ?
`);

const updateOrderStatus = db.prepare(`
  UPDATE "Order" 
  SET status = ?, updatedAt = CURRENT_TIMESTAMP 
  WHERE id = ?
`);

const updateProductStock = db.prepare(`
  UPDATE Product 
  SET stock = stock - ?, updatedAt = CURRENT_TIMESTAMP 
  WHERE id = ?
`);

module.exports = {
  user: {
    create: ({ data }) => {
      const role = data.role || 'customer';
      const result = createUser.run(data.email, data.username, data.password, role);
      return { id: result.lastInsertRowid, ...data, role };
    },
    findUnique: ({ where }) => {
      if (where.email) return findUserByEmail.get(where.email);
      if (where.id) return findUserById.get(where.id);
      return null;
    },
    findFirst: ({ where }) => {
      if (where.OR) {
        for (const condition of where.OR) {
          if (condition.email) {
            const user = findUserByEmail.get(condition.email);
            if (user) return user;
          }
          if (condition.username) {
            const user = db.prepare('SELECT * FROM User WHERE username = ?').get(condition.username);
            if (user) return user;
          }
        }
      }
      return null;
    }
  },
  product: {
    create: ({ data }) => {
      const result = createProduct.run(
        data.name, 
        data.description || null, 
        data.price, 
        data.imageUrl || null, 
        data.category, 
        data.stock || 0
      );
      return { id: result.lastInsertRowid, ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    },
    findMany: ({ where, take, skip, orderBy }) => {
      let query;
      let params = [];
      
      if (where?.category && where?.OR) {
        // Search within category
        const searchTerm = `%${where.OR[0].name.contains}%`;
        query = db.prepare(`
          SELECT * FROM Product 
          WHERE category = ? AND (name LIKE ? OR description LIKE ?)
          ORDER BY createdAt DESC
          LIMIT ? OFFSET ?
        `);
        params = [where.category, searchTerm, searchTerm, take || 50, skip || 0];
      } else if (where?.category) {
        query = db.prepare(`
          SELECT * FROM Product 
          WHERE category = ?
          ORDER BY createdAt DESC
          LIMIT ? OFFSET ?
        `);
        params = [where.category, take || 50, skip || 0];
      } else if (where?.OR) {
        const searchTerm = `%${where.OR[0].name.contains}%`;
        query = db.prepare(`
          SELECT * FROM Product 
          WHERE name LIKE ? OR description LIKE ?
          ORDER BY createdAt DESC
          LIMIT ? OFFSET ?
        `);
        params = [searchTerm, searchTerm, take || 50, skip || 0];
      } else {
        query = db.prepare(`
          SELECT * FROM Product 
          ORDER BY createdAt DESC
          LIMIT ? OFFSET ?
        `);
        params = [take || 50, skip || 0];
      }
      
      return query.all(...params);
    },
    findUnique: ({ where }) => {
      return findProductById.get(where.id);
    },
    update: ({ where, data }) => {
      const current = findProductById.get(where.id);
      if (!current) return null;
      
      updateProduct.run(
        data.name ?? current.name,
        data.description !== undefined ? data.description : current.description,
        data.price ?? current.price,
        data.imageUrl !== undefined ? data.imageUrl : current.imageUrl,
        data.category ?? current.category,
        data.stock ?? current.stock,
        where.id
      );
      
      return { ...current, ...data, updatedAt: new Date().toISOString() };
    },
    delete: ({ where }) => {
      deleteProduct.run(where.id);
      return {};
    },
    count: ({ where }) => {
      let query;
      let params = [];
      
      if (where?.category && where?.OR) {
        const searchTerm = `%${where.OR[0].name.contains}%`;
        query = db.prepare(`
          SELECT COUNT(*) as count FROM Product 
          WHERE category = ? AND (name LIKE ? OR description LIKE ?)
        `);
        params = [where.category, searchTerm, searchTerm];
      } else if (where?.category) {
        query = db.prepare(`SELECT COUNT(*) as count FROM Product WHERE category = ?`);
        params = [where.category];
      } else if (where?.OR) {
        const searchTerm = `%${where.OR[0].name.contains}%`;
        query = db.prepare(`
          SELECT COUNT(*) as count FROM Product 
          WHERE name LIKE ? OR description LIKE ?
        `);
        params = [searchTerm, searchTerm];
      } else {
        query = db.prepare(`SELECT COUNT(*) as count FROM Product`);
      }
      
      const result = query.get(...params);
      return result.count;
    }
  },
  cartItem: {
    create: ({ data }) => {
      const result = createCartItem.run(data.userId, data.productId, data.quantity);
      const cartItem = findCartItemById.get(result.lastInsertRowid);
      return {
        id: result.lastInsertRowid,
        userId: data.userId,
        productId: data.productId,
        quantity: data.quantity,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        product: {
          id: cartItem.productId,
          name: cartItem.name,
          description: cartItem.description,
          price: cartItem.price,
          imageUrl: cartItem.imageUrl,
          category: cartItem.category,
          stock: cartItem.stock
        }
      };
    },
    findMany: ({ where, include }) => {
      const items = findCartByUserId.all(where.userId);
      return items.map(item => ({
        id: item.id,
        userId: item.userId,
        productId: item.productId,
        quantity: item.quantity,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        product: {
          id: item.productId,
          name: item.name,
          description: item.description,
          price: item.price,
          imageUrl: item.imageUrl,
          category: item.category,
          stock: item.stock
        }
      }));
    },
    findUnique: ({ where }) => {
      if (where.userId_productId) {
        return findCartItem.get(where.userId_productId.userId, where.userId_productId.productId);
      }
      return null;
    },
    findFirst: ({ where }) => {
      if (where.id && where.userId) {
        const item = findCartItemById.get(where.id);
        if (item && item.userId === where.userId) {
          return {
            id: item.id,
            userId: item.userId,
            productId: item.productId,
            quantity: item.quantity,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            product: {
              id: item.productId,
              name: item.name,
              description: item.description,
              price: item.price,
              imageUrl: item.imageUrl,
              category: item.category,
              stock: item.stock
            }
          };
        }
      }
      return null;
    },
    update: ({ where, data, include }) => {
      updateCartItemQuantity.run(data.quantity, where.id);
      const item = findCartItemById.get(where.id);
      return {
        id: item.id,
        userId: item.userId,
        productId: item.productId,
        quantity: data.quantity,
        createdAt: item.createdAt,
        updatedAt: new Date().toISOString(),
        product: {
          id: item.productId,
          name: item.name,
          description: item.description,
          price: item.price,
          imageUrl: item.imageUrl,
          category: item.category,
          stock: item.stock
        }
      };
    },
    delete: ({ where }) => {
      deleteCartItem.run(where.id);
      return {};
    },
    deleteMany: ({ where }) => {
      deleteAllCartItems.run(where.userId);
      return {};
    }
  },
  order: {
    create: ({ data }) => {
      const result = createOrder.run(data.userId, data.total, data.status || 'pending');
      return { id: result.lastInsertRowid, ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    },
    findMany: ({ where, include }) => {
      const orders = findOrdersByUserId.all(where.userId);
      return orders.map(order => {
        const orderItems = findOrderItemsByOrderId.all(order.id);
        return {
          ...order,
          orderItems: orderItems.map(item => ({
            id: item.id,
            orderId: item.orderId,
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            createdAt: item.createdAt,
            product: {
              id: item.productId,
              name: item.name,
              description: item.description,
              imageUrl: item.imageUrl,
              category: item.category
            }
          }))
        };
      });
    },
    findFirst: ({ where, include }) => {
      const order = findOrderById.get(where.id);
      if (!order || order.userId !== where.userId) return null;
      
      const orderItems = findOrderItemsByOrderId.all(order.id);
      return {
        ...order,
        orderItems: orderItems.map(item => ({
          id: item.id,
          orderId: item.orderId,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          createdAt: item.createdAt,
          product: {
            id: item.productId,
            name: item.name,
            description: item.description,
            imageUrl: item.imageUrl,
            category: item.category
          }
        }))
      };
    },
    findUnique: ({ where, include }) => {
      const order = findOrderById.get(where.id);
      if (!order) return null;
      
      const orderItems = findOrderItemsByOrderId.all(order.id);
      return {
        ...order,
        orderItems: orderItems.map(item => ({
          id: item.id,
          orderId: item.orderId,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          createdAt: item.createdAt,
          product: {
            id: item.productId,
            name: item.name,
            description: item.description,
            imageUrl: item.imageUrl,
            category: item.category
          }
        }))
      };
    },
    update: ({ where, data, include }) => {
      updateOrderStatus.run(data.status, where.id);
      const order = findOrderById.get(where.id);
      const orderItems = findOrderItemsByOrderId.all(order.id);
      return {
        ...order,
        status: data.status,
        updatedAt: new Date().toISOString(),
        orderItems: orderItems.map(item => ({
          id: item.id,
          orderId: item.orderId,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          createdAt: item.createdAt,
          product: {
            id: item.productId,
            name: item.name,
            description: item.description,
            imageUrl: item.imageUrl,
            category: item.category
          }
        }))
      };
    }
  },
  orderItem: {
    create: ({ data }) => {
      const result = createOrderItem.run(data.orderId, data.productId, data.quantity, data.price);
      return { id: result.lastInsertRowid, ...data, createdAt: new Date().toISOString() };
    }
  },
  post: {
    create: ({ data, include }) => {
      const result = createPost.run(data.title, data.content, data.published ? 1 : 0, data.authorId);
      const post = findPostById.get(result.lastInsertRowid);
      return {
        id: result.lastInsertRowid,
        title: data.title,
        content: data.content,
        published: Boolean(data.published),
        authorId: data.authorId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        author: {
          id: post.authorId,
          username: post.username,
          email: post.email
        }
      };
    },
    findMany: ({ include, orderBy }) => {
      const posts = findAllPosts.all();
      return posts.map(post => ({
        id: post.id,
        title: post.title,
        content: post.content,
        published: Boolean(post.published),
        authorId: post.authorId,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        author: {
          id: post.authorId,
          username: post.username,
          email: post.email
        }
      }));
    },
    findUnique: ({ where, include }) => {
      const post = findPostById.get(where.id);
      if (!post) return null;
      return {
        id: post.id,
        title: post.title,
        content: post.content,
        published: Boolean(post.published),
        authorId: post.authorId,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        author: {
          id: post.authorId,
          username: post.username,
          email: post.email
        }
      };
    },
    update: ({ where, data, include }) => {
      const current = findPostById.get(where.id);
      if (!current) return null;
      
      const title = data.title ?? current.title;
      const content = data.content !== undefined ? data.content : current.content;
      const published = data.published !== undefined ? (data.published ? 1 : 0) : current.published;
      
      updatePost.run(title, content, published, where.id);
      
      return {
        id: current.id,
        title,
        content,
        published: Boolean(published),
        authorId: current.authorId,
        createdAt: current.createdAt,
        updatedAt: new Date().toISOString(),
        author: {
          id: current.authorId,
          username: current.username,
          email: current.email
        }
      };
    },
    delete: ({ where }) => {
      deletePost.run(where.id);
      return {};
    }
  },
  // Transaction support
  $transaction: async (callback) => {
    const transaction = db.transaction(() => {
      return callback({
        order: module.exports.order,
        orderItem: module.exports.orderItem,
        product: {
          ...module.exports.product,
          update: ({ where, data }) => {
            if (data.stock?.decrement) {
              updateProductStock.run(data.stock.decrement, where.id);
              return findProductById.get(where.id);
            }
            return module.exports.product.update({ where, data });
          }
        },
        cartItem: module.exports.cartItem
      });
    });
    return transaction();
  },
  // Special method for getting categories
  getCategories: () => {
    return getCategories.all().map(row => row.category);
  },
  $disconnect: () => {
    db.close();
  }
};