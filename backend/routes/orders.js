const express = require('express');
const db = require('../db');
const { authenticateToken } = require('./auth');

const router = express.Router();

// Get user's orders
router.get('/', authenticateToken, async (req, res) => {
  try {
    const orders = await db.order.findMany({
      where: { userId: req.user.userId },
      include: {
        orderItems: {
          include: {
            product: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(orders);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single order
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const order = await db.order.findFirst({
      where: {
        id: parseInt(id),
        userId: req.user.userId
      },
      include: {
        orderItems: {
          include: {
            product: true
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create order (checkout)
router.post('/checkout', authenticateToken, async (req, res) => {
  try {
    // Get user's cart items
    const cartItems = await db.cartItem.findMany({
      where: { userId: req.user.userId },
      include: { product: true }
    });

    if (cartItems.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // Check stock availability and calculate total
    let total = 0;
    const orderItems = [];

    for (const cartItem of cartItems) {
      if (cartItem.product.stock < cartItem.quantity) {
        return res.status(400).json({ 
          error: `Insufficient stock for ${cartItem.product.name}` 
        });
      }
      
      const itemTotal = cartItem.product.price * cartItem.quantity;
      total += itemTotal;
      
      orderItems.push({
        productId: cartItem.productId,
        quantity: cartItem.quantity,
        price: cartItem.product.price
      });
    }

    // Create order with order items in a transaction
    const order = await db.$transaction(async (prisma) => {
      // Create the order
      const newOrder = await prisma.order.create({
        data: {
          userId: req.user.userId,
          total,
          status: 'pending'
        }
      });

      // Create order items
      const createdOrderItems = await Promise.all(
        orderItems.map(item =>
          prisma.orderItem.create({
            data: {
              orderId: newOrder.id,
              productId: item.productId,
              quantity: item.quantity,
              price: item.price
            }
          })
        )
      );

      // Update product stock
      await Promise.all(
        cartItems.map(cartItem =>
          prisma.product.update({
            where: { id: cartItem.productId },
            data: {
              stock: {
                decrement: cartItem.quantity
              }
            }
          })
        )
      );

      // Clear the cart
      await prisma.cartItem.deleteMany({
        where: { userId: req.user.userId }
      });

      // Return order with items
      return await prisma.order.findUnique({
        where: { id: newOrder.id },
        include: {
          orderItems: {
            include: {
              product: true
            }
          }
        }
      });
    });

    res.status(201).json(order);
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: Get all orders
router.get('/admin/all', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    const user = await db.user.findUnique({
      where: { id: req.user.userId }
    });

    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { status, limit = 50, offset = 0 } = req.query;
    
    const where = {};
    if (status) {
      where.status = status;
    }

    const orders = await db.order.findMany({
      where,
      include: {
        user: {
          select: { id: true, email: true, username: true }
        },
        orderItems: {
          include: {
            product: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    const total = await db.order.count({ where });

    res.json({
      orders,
      total,
      hasMore: total > parseInt(offset) + orders.length
    });
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: Update order status
router.put('/admin/:id/status', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    const user = await db.user.findUnique({
      where: { id: req.user.userId }
    });

    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Valid status required' });
    }

    const order = await db.order.findUnique({
      where: { id: parseInt(id) }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const updatedOrder = await db.order.update({
      where: { id: parseInt(id) },
      data: { status },
      include: {
        user: {
          select: { id: true, email: true, username: true }
        },
        orderItems: {
          include: {
            product: true
          }
        }
      }
    });

    res.json(updatedOrder);
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;