import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Check, Star } from "lucide-react";
import type { Product } from "@shared/schema";

interface ProductCardProps {
  product: Product;
  isPopular?: boolean;
  onSelect: (productId: string) => void;
}

export default function ProductCard({ product, isPopular, onSelect }: ProductCardProps) {
  const benefits = JSON.parse(product.benefits) as string[];

  return (
    <Card className={`product-card-hover ${isPopular ? 'border-2 border-primary' : ''} relative`}>
      {isPopular && (
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <span className="popular-badge px-4 py-1 rounded-full text-sm font-semibold">
            POPULAR
          </span>
        </div>
      )}
      
      <CardHeader className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h3>
        <div className="text-3xl font-bold text-primary mb-2">
          R{Number(product.monthlyPrice).toFixed(0)}
          <span className="text-lg text-gray-600">/month</span>
        </div>
        <div className="text-sm text-gray-500">
          {product.activationPoints.toLocaleString()} Activation Points
        </div>
      </CardHeader>

      <CardContent>
        <ul className="space-y-3 mb-8">
          {benefits.map((benefit, index) => (
            <li key={index} className="flex items-center text-gray-700">
              {product.name === "PINNACLE" && index >= benefits.length - 2 ? (
                <Star className="h-4 w-4 text-yellow-500 mr-3 flex-shrink-0" />
              ) : (
                <Check className="h-4 w-4 text-secondary mr-3 flex-shrink-0" />
              )}
              <span className="text-sm">{benefit}</span>
            </li>
          ))}
        </ul>
        
        <Button 
          className="w-full" 
          onClick={() => onSelect(product.id)}
        >
          Select Plan
        </Button>
      </CardContent>
    </Card>
  );
}
