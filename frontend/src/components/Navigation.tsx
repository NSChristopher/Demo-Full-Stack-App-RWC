import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import { 
  ShoppingCart, 
  Package, 
  ShoppingBag, 
  LogOut,
  Settings
} from 'lucide-react';

const Navigation: React.FC = () => {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      // Error is handled in the hook
    }
  };

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and main navigation */}
          <div className="flex items-center space-x-8">
            <Link to="/" className="text-xl font-bold text-gray-900">
              Beauty Shop
            </Link>
            
            <div className="hidden md:flex space-x-6">
              <Link
                to="/products"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Products
              </Link>
              {user && (
                <Link
                  to="/orders"
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Orders
                </Link>
              )}
              {user?.role === 'admin' && (
                <Link
                  to="/admin/products"
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Manage Products
                </Link>
              )}
            </div>
          </div>

          {/* Right side navigation */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {/* Cart Icon with Badge */}
                <Link to="/cart" className="relative">
                  <Button variant="ghost" size="sm">
                    <ShoppingCart className="h-5 w-5" />
                    {cart.itemCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {cart.itemCount}
                      </span>
                    )}
                  </Button>
                </Link>

                {/* User Menu */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600 hidden sm:block">
                    Welcome, {user.username}
                  </span>
                  {user.role === 'admin' && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      Admin
                    </span>
                  )}
                  <Button variant="ghost" size="sm" onClick={handleLogout}>
                    <LogOut className="h-4 w-4" />
                    <span className="ml-1 hidden sm:block">Logout</span>
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Login
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile navigation */}
        <div className="md:hidden border-t py-3">
          <div className="flex space-x-4 overflow-x-auto">
            <Link
              to="/products"
              className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 whitespace-nowrap"
            >
              <Package className="h-4 w-4" />
              <span>Products</span>
            </Link>
            {user && (
              <Link
                to="/orders"
                className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 whitespace-nowrap"
              >
                <ShoppingBag className="h-4 w-4" />
                <span>Orders</span>
              </Link>
            )}
            {user?.role === 'admin' && (
              <Link
                to="/admin/products"
                className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 whitespace-nowrap"
              >
                <Settings className="h-4 w-4" />
                <span>Manage</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;