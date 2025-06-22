import { useState, useEffect, useCallback } from 'react';
import { Cart, CartItem, Order } from '@/types';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useAuth } from './useAuth';

export const useCart = () => {
  const [cart, setCart] = useState<Cart>({ items: [], total: 0, itemCount: 0 });
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchCart = useCallback(async () => {
    if (!user) {
      setCart({ items: [], total: 0, itemCount: 0 });
      return;
    }

    try {
      setLoading(true);
      const response = await api.get<Cart>('/cart');
      setCart(response.data);
    } catch (error: any) {
      console.error('Fetch cart error:', error);
      // Don't show error toast for 401 (unauthorized) errors
      if (error.response?.status !== 401) {
        toast.error('Failed to load cart');
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = async (productId: number, quantity: number = 1) => {
    if (!user) {
      toast.error('Please log in to add items to cart');
      return;
    }

    try {
      const response = await api.post<CartItem>('/cart/add', { productId, quantity });
      await fetchCart(); // Refresh cart after adding
      toast.success('Item added to cart');
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to add item to cart';
      toast.error(message);
      throw error;
    }
  };

  const updateCartItem = async (cartItemId: number, quantity: number) => {
    try {
      const response = await api.put<CartItem>(`/cart/${cartItemId}`, { quantity });
      await fetchCart(); // Refresh cart after updating
      toast.success('Cart updated');
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to update cart item';
      toast.error(message);
      throw error;
    }
  };

  const removeFromCart = async (cartItemId: number) => {
    try {
      await api.delete(`/cart/${cartItemId}`);
      await fetchCart(); // Refresh cart after removing
      toast.success('Item removed from cart');
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to remove item from cart';
      toast.error(message);
      throw error;
    }
  };

  const clearCart = async () => {
    try {
      await api.delete('/cart');
      await fetchCart(); // Refresh cart after clearing
      toast.success('Cart cleared');
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to clear cart';
      toast.error(message);
      throw error;
    }
  };

  const checkout = async () => {
    if (!user) {
      toast.error('Please log in to checkout');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post<Order>('/orders/checkout');
      await fetchCart(); // Clear cart after successful checkout
      toast.success('Order placed successfully!');
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error || 'Checkout failed';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    cart,
    loading,
    fetchCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    checkout,
  };
};

export const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchOrders = useCallback(async () => {
    if (!user) {
      setOrders([]);
      return;
    }

    try {
      setLoading(true);
      const response = await api.get<Order[]>('/orders');
      setOrders(response.data);
    } catch (error: any) {
      console.error('Fetch orders error:', error);
      if (error.response?.status !== 401) {
        toast.error('Failed to load orders');
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const getOrder = async (id: number) => {
    try {
      const response = await api.get<Order>(`/orders/${id}`);
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to load order';
      toast.error(message);
      throw error;
    }
  };

  return {
    orders,
    loading,
    fetchOrders,
    getOrder,
  };
};