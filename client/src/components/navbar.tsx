import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authAPI } from "@/lib/auth";
import { LogOut, User, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Navbar() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: authData } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: () => authAPI.getMe(),
    retry: false,
    meta: {
      errorHandler: () => {}, // Suppress error notifications for auth check
    },
  });

  const logoutMutation = useMutation({
    mutationFn: authAPI.logout,
    onSuccess: () => {
      queryClient.clear();
      setLocation("/");
      toast({
        title: "Logged out successfully",
      });
    },
  });

  const user = authData?.user;

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-primary">LifeStyle Pro</h1>
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <div className="flex items-center space-x-2 text-sm text-gray-700">
                  {user.role === "admin" ? (
                    <Users className="h-4 w-4" />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                  <span>
                    {user.firstName} {user.lastName}
                    <span className="text-gray-500 ml-1">({user.role})</span>
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => logoutMutation.mutate()}
                  disabled={logoutMutation.isPending}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link href="/login?role=agent">
                  <Button variant="ghost" size="sm" className="text-gray-700 hover:text-gray-900">
                    Agent Login
                  </Button>
                </Link>
                <Link href="/login?role=admin">
                  <Button size="sm" className="bg-primary text-white hover:bg-primary/90">
                    Admin Login
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
