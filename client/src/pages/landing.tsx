import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import ProductCard from "@/components/product-card";
import { Rocket, Phone, Headset } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@shared/schema";

export default function Landing() {
  const { toast } = useToast();
  const [selectedProductId, setSelectedProductId] = useState<string>("");

  const { data: products = [] } = useQuery({
    queryKey: ["/api/products"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/products");
      return response.json();
    },
  });

  const createLeadMutation = useMutation({
    mutationFn: async (productId?: string) => {
      const response = await apiRequest("POST", "/api/leads", {
        productInterest: productId ? products.find(p => p.id === productId)?.name : "General",
        source: "website",
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Thank you for your interest!",
        description: "An agent will contact you shortly to discuss your options.",
      });
    },
  });

  const handleProductSelect = (productId: string) => {
    setSelectedProductId(productId);
    createLeadMutation.mutate(productId);
  };

  const handleGetStarted = () => {
    createLeadMutation.mutate(undefined);
  };

  // Sort products by price for display
  const sortedProducts = [...products].sort((a, b) => Number(a.monthlyPrice) - Number(b.monthlyPrice));
  const popularProductIndex = Math.floor(sortedProducts.length / 2); // Middle product as popular

  return (
    <div>
      {/* Hero Section */}
      <section className="hero-gradient text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">Protect Your Future Today</h1>
          <p className="text-xl md:text-2xl mb-8 text-blue-100">
            Comprehensive lifestyle protection plans tailored for your needs
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              variant="secondary"
              className="bg-white text-primary hover:bg-gray-100"
              onClick={handleGetStarted}
              disabled={createLeadMutation.isPending}
            >
              <Rocket className="h-5 w-5 mr-2" />
              Get Started Now
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-white text-white hover:bg-white hover:text-primary"
              onClick={handleGetStarted}
              disabled={createLeadMutation.isPending}
            >
              <Phone className="h-5 w-5 mr-2" />
              Talk to an Agent
            </Button>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Choose Your Protection Plan
            </h2>
            <p className="text-xl text-gray-600">
              Select the perfect lifestyle protection package for your needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
            {sortedProducts.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                isPopular={index === popularProductIndex}
                onSelect={handleProductSelect}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-100 py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Get Protected?</h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of satisfied customers who trust us with their lifestyle protection
          </p>
          <Button
            size="lg"
            onClick={handleGetStarted}
            disabled={createLeadMutation.isPending}
          >
            <Headset className="h-5 w-5 mr-2" />
            Speak with an Agent Now
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">LifeStyle Pro</h3>
              <p className="text-gray-300">
                Protecting your lifestyle with comprehensive coverage and peace of mind.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Products</h4>
              <ul className="space-y-2 text-gray-300">
                {products.map((product) => (
                  <li key={product.id}>{product.name}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-300">
                <li>Contact Us</li>
                <li>Claims</li>
                <li>FAQ</li>
                <li>Documentation</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <div className="text-gray-300 space-y-2">
                <p>📞 0800 123 456</p>
                <p>✉️ info@lifestylepro.co.za</p>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 LifeStyle Pro. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
