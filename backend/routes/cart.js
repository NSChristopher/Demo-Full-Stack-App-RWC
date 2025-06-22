const express = require('express');
const db = require('../db');
const { authenticateToken } = require('./auth');

const router = express.Router();

// Get user's cart
router.get('/', authenticateToken, async (req, res) => {
  try {
    const cartItems = await db.cartItem.findMany({
      where: { userId: req.user.userId },
      include: {
        product: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const total = cartItems.reduce((sum, item) => {
      return sum + (item.product.price * item.quantity);
    }, 0);

    res.json({
      items: cartItems,
      total,
      itemCount: cartItems.reduce((sum, item) => sum + item.quantity, 0)
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add item to cart
router.post('/add', authenticateToken, async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    if (!productId || quantity < 1) {
      return res.status(400).json({ error: 'Valid product ID and quantity required' });
    }

    // Check if product exists
    const product = await db.product.findUnique({
      where: { id: parseInt(productId) }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ error: 'Insufficient stock' });
    }

    // Check if item already exists in cart
    const existingCartItem = await db.cartItem.findUnique({
      where: {
        userId_productId: {
          userId: req.user.userId,
          productId: parseInt(productId)
        }
      }
    });

    let cartItem;
    if (existingCartItem) {
      // Update quantity
      const newQuantity = existingCartItem.quantity + parseInt(quantity);
      if (product.stock < newQuantity) {
        return res.status(400).json({ error: 'Insufficient stock' });
      }
      
      cartItem = await db.cartItem.update({
        where: { id: existingCartItem.id },
        data: { quantity: newQuantity },
        include: { product: true }
      });
    } else {
      // Create new cart item
      cartItem = await db.cartItem.create({
        data: {
          userId: req.user.userId,
          productId: parseInt(productId),
          quantity: parseInt(quantity)
        },
        include: { product: true }
      });
    }

    res.status(201).json(cartItem);
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update cart item quantity
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({ error: 'Valid quantity required' });
    }

    const cartItem = await db.cartItem.findFirst({
      where: {
        id: parseInt(id),
        userId: req.user.userId
      },
      include: { product: true }
    });

    if (!cartItem) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    if (cartItem.product.stock < quantity) {
      return res.status(400).json({ error: 'Insufficient stock' });
    }

    const updatedCartItem = await db.cartItem.update({
      where: { id: parseInt(id) },
      data: { quantity: parseInt(quantity) },
      include: { product: true }
    });

    res.json(updatedCartItem);
  } catch (error) {
    console.error('Update cart item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove item from cart
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const cartItem = await db.cartItem.findFirst({
      where: {
        id: parseInt(id),
        userId: req.user.userId
      }
    });

    if (!cartItem) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    await db.cartItem.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Item removed from cart' });
  } catch (error) {
    console.error('Remove cart item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Clear cart
router.delete('/', authenticateToken, async (req, res) => {
  try {
    await db.cartItem.deleteMany({
      where: { userId: req.user.userId }
    });

    res.json({ message: 'Cart cleared successfully' });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;