import { useState, useEffect } from 'react';
import { Product, ProductsResponse, CreateProductData, UpdateProductData } from '@/types';
import api from '@/lib/api';
import { toast } from 'sonner';

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const fetchProducts = async (params: {
    category?: string;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}) => {
    try {
      setLoading(true);
      const response = await api.get<ProductsResponse>('/products', { params });
      
      if (params.offset && params.offset > 0) {
        setProducts(prev => [...prev, ...response.data.products]);
      } else {
        setProducts(response.data.products);
      }
      
      setTotal(response.data.total);
      setHasMore(response.data.hasMore);
    } catch (error: any) {
      console.error('Fetch products error:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const createProduct = async (data: CreateProductData) => {
    try {
      const response = await api.post<Product>('/products', data);
      setProducts(prev => [response.data, ...prev]);
      toast.success('Product created successfully');
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to create product';
      toast.error(message);
      throw error;
    }
  };

  const updateProduct = async (id: number, data: UpdateProductData) => {
    try {
      const response = await api.put<Product>(`/products/${id}`, data);
      setProducts(prev => 
        prev.map(product => 
          product.id === id ? response.data : product
        )
      );
      toast.success('Product updated successfully');
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to update product';
      toast.error(message);
      throw error;
    }
  };

  const deleteProduct = async (id: number) => {
    try {
      await api.delete(`/products/${id}`);
      setProducts(prev => prev.filter(product => product.id !== id));
      toast.success('Product deleted successfully');
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to delete product';
      toast.error(message);
      throw error;
    }
  };

  const getProduct = async (id: number) => {
    try {
      const response = await api.get<Product>(`/products/${id}`);
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to load product';
      toast.error(message);
      throw error;
    }
  };

  return {
    products,
    loading,
    total,
    hasMore,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    getProduct,
  };
};

export const useCategories = () => {
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await api.get<string[]>('/products/categories');
      setCategories(response.data);
    } catch (error: any) {
      console.error('Fetch categories error:', error);
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return {
    categories,
    loading,
    fetchCategories,
  };
};