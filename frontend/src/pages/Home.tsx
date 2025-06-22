import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, ShoppingBag, Heart, Search } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                Beauty Shop
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <Link to="/products">
                    <Button variant="ghost">Browse Products</Button>
                  </Link>
                  <Link to="/cart">
                    <Button>Cart</Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="ghost">Login</Button>
                  </Link>
                  <Link to="/register">
                    <Button>Get Started</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Discover Your Beauty
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Premium beauty products curated just for you. From skincare to makeup, 
            find everything you need to look and feel your best.
          </p>
          <div className="flex justify-center space-x-4">
            <Link to="/products">
              <Button size="lg" className="flex items-center">
                Shop Now <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            {!user && (
              <Link to="/register">
                <Button variant="outline" size="lg">
                  Create Account
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card className="text-center p-6">
            <CardHeader>
              <div className="mx-auto mb-4 w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
                <Search className="h-6 w-6 text-pink-600" />
              </div>
              <CardTitle>Easy Discovery</CardTitle>
              <CardDescription>
                Browse products by category or search for specific items to find exactly what you need.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center p-6">
            <CardHeader>
              <div className="mx-auto mb-4 w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <ShoppingBag className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle>Seamless Shopping</CardTitle>
              <CardDescription>
                Add products to your cart and checkout securely with our streamlined shopping experience.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center p-6">
            <CardHeader>
              <div className="mx-auto mb-4 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Heart className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle>Quality Products</CardTitle>
              <CardDescription>
                Carefully curated beauty products from trusted brands to help you look and feel amazing.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to Start Shopping?
          </h3>
          <p className="text-gray-600 mb-6">
            Join thousands of happy customers who trust us for their beauty needs.
          </p>
          <div className="flex justify-center space-x-4">
            <Link to="/products">
              <Button size="lg">
                Browse Products
              </Button>
            </Link>
            {!user && (
              <Link to="/register">
                <Button variant="outline" size="lg">
                  Sign Up Free
                </Button>
              </Link>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;