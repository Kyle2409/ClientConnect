import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/navbar";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import AgentDashboard from "@/pages/agent-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import NotFound from "@/pages/not-found";
import { authAPI } from "@/lib/auth";

function ProtectedRoute({ children, requiredRole }: { children: React.ReactNode; requiredRole?: string }) {
  const { data: authData, isLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: () => authAPI.getMe(),
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!authData?.user) {
    return <Redirect to="/login" />;
  }

  if (requiredRole && authData.user.role !== requiredRole) {
    return <Redirect to="/" />;
  }

  return <>{children}</>;
}

function Router() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/login" component={Login} />
        <Route path="/agent">
          <ProtectedRoute requiredRole="agent">
            <AgentDashboard />
          </ProtectedRoute>
        </Route>
        <Route path="/admin">
          <ProtectedRoute requiredRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        </Route>
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
