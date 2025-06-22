export interface User {
  id: number;
  email: string;
  username: string;
  role?: string;
  createdAt?: string;
}

export interface Post {
  id: number;
  title: string;
  content?: string;
  published: boolean;
  authorId: number;
  author: User;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  category: string;
  stock: number;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  id: number;
  userId: number;
  productId: number;
  quantity: number;
  product: Product;
  createdAt: string;
  updatedAt: string;
}

export interface Cart {
  items: CartItem[];
  total: number;
  itemCount: number;
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  price: number;
  product: Product;
  createdAt: string;
}

export interface Order {
  id: number;
  userId: number;
  total: number;
  status: string;
  orderItems: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  message: string;
  user: User;
}

export interface CreatePostData {
  title: string;
  content?: string;
  published?: boolean;
}

export interface UpdatePostData {
  title?: string;
  content?: string;
  published?: boolean;
}

export interface CreateProductData {
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  category: string;
  stock?: number;
}

export interface UpdateProductData {
  name?: string;
  description?: string;
  price?: number;
  imageUrl?: string;
  category?: string;
  stock?: number;
}

export interface ProductsResponse {
  products: Product[];
  total: number;
  hasMore: boolean;
}