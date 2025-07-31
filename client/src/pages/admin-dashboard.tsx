import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, Bus, TrendingUp, DollarSign } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function AdminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ["/api/admin/stats"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/stats");
      return response.json() as {
        totalSignups: number;
        activeAgents: number;
        monthlySignups: number;
        totalRevenue: number;
      };
    },
  });

  const { data: agents = [] } = useQuery({
    queryKey: ["/api/admin/agents"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/agents");
      return response.json() as {
        agentId: string;
        agentName: string;
        totalSignups: number;
        monthlySignups: number;
        totalRevenue: number;
      }[];
    },
  });

  const { data: productPopularity = [] } = useQuery({
    queryKey: ["/api/admin/products/popularity"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/products/popularity");
      return response.json() as {
        productName: string;
        count: number;
        percentage: number;
      }[];
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getProgressColor = (index: number) => {
    const colors = ['bg-primary', 'bg-secondary', 'bg-yellow-500', 'bg-purple-500', 'bg-red-500'];
    return colors[index % colors.length];
  };

  // Sort agents by total signups for top performers
  const topAgents = [...agents].sort((a, b) => b.totalSignups - a.totalSignups).slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">System overview and agent performance</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total Signups</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.totalSignups?.toLocaleString() || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-secondary/10 rounded-lg">
                  <Bus className="h-6 w-6 text-secondary" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Active Agents</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.activeAgents || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-500/10 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">This Month</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.monthlySignups || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <DollarSign className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats?.totalRevenue ? formatCurrency(stats.totalRevenue) : formatCurrency(0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Product Popularity */}
          <Card>
            <CardHeader>
              <CardTitle>Product Popularity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {productPopularity.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">No product data available</p>
                ) : (
                  productPopularity.map((product, index) => (
                    <div key={product.productName} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`w-4 h-4 rounded mr-3 ${getProgressColor(index)}`}></div>
                        <span className="text-sm font-medium">{product.productName}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">{product.percentage}%</span>
                        <div className="w-20">
                          <Progress value={product.percentage} className="h-2" />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Top Performing Agents */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Agents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topAgents.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">No agent data available</p>
                ) : (
                  topAgents.map((agent, index) => (
                    <div key={agent.agentId} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-primary text-xs font-semibold">
                            {agent.agentName.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">{agent.agentName}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">{agent.totalSignups} signups</p>
                        <p className="text-xs text-gray-500">{formatCurrency(agent.totalRevenue)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* All Agents Performance Table */}
        <Card>
          <CardHeader>
            <CardTitle>Agent Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead>Total Signups</TableHead>
                  <TableHead>This Month</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      No agent data available
                    </TableCell>
                  </TableRow>
                ) : (
                  agents.map((agent) => (
                    <TableRow key={agent.agentId}>
                      <TableCell>
                        <div className="flex items-center">
                          <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-primary font-semibold">
                              {agent.agentName.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{agent.agentName}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{agent.totalSignups}</TableCell>
                      <TableCell>{agent.monthlySignups}</TableCell>
                      <TableCell>{formatCurrency(agent.totalRevenue)}</TableCell>
                      <TableCell>
                        <Badge variant="default">Active</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
