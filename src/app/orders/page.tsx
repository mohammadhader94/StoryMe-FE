
'use client';

import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AlertTriangle, Inbox, Search, PlusCircle } from 'lucide-react'; // Added PlusCircle
import Link from 'next/link'; // Import Link

import { getOrders } from '@/services/orderService'; // Import mock getOrders
import OrderCard from '@/components/orders/order-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button'; // Import Button
import type { Order } from '@/types/order';

const queryClient = new QueryClient(); // Instantiate QueryClient


const OrdersPage: FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch orders using React Query with the mock service
  const { data: orders, isLoading, isError, error, status } = useQuery<Order[], Error>({
    queryKey: ['orders'], // Keep queryKey consistent
    queryFn: getOrders, // Use the mock function
    // Optional React Query config:
    // staleTime: 1000 * 60 * 1,
    // refetchOnWindowFocus: false,
  });

  // Filter orders based on search term (works the same with mock data)
  const filteredOrders = orders?.filter(order =>
    order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (order.orderSummary && order.orderSummary.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (order.email && order.email.toLowerCase().includes(searchTerm.toLowerCase())) // Added email search
  );

  const renderLoading = () => (
     <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-4 border rounded-lg bg-card">
              <div className="flex justify-between items-center">
                 <div className="flex-grow space-y-2 mr-4">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-3 w-1/3" />
                 </div>
                 <div className="flex items-center space-x-2 shrink-0">
                    <Skeleton className="h-5 w-20 rounded-full" />
                    <Skeleton className="h-5 w-5 rounded-full" />
                 </div>
              </div>
            </div>
          ))}
        </div>
  );

  const renderError = () => (
     <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Fetching Orders</AlertTitle>
          <AlertDescription>
            {error?.message || 'An unexpected error occurred while fetching mock orders. Please try refreshing the page.'}
          </AlertDescription>
        </Alert>
  );

  const renderEmpty = () => (
     <div className="text-center py-12 bg-card rounded-lg shadow-sm card">
          <Inbox className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium text-foreground">
            {searchTerm ? 'No Orders Found' : 'No Mock Orders Available'}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {searchTerm
              ? 'Try adjusting your search terms.'
              : 'The mock data store is empty or failed to load.'}
          </p>
           <Button asChild className="mt-4 btn">
             <Link href="/orders/new">
               <PlusCircle className="mr-2 h-4 w-4" />
               Create New Mock Order
             </Link>
           </Button>
        </div>
  );

  const renderOrdersList = (ordersToRender: Order[]) => (
      <div className="space-y-3">
        {ordersToRender.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
      </div>
  );


  const renderContent = () => {
    if (isLoading) {
        console.log("Rendering: Loading State (Mock)");
        return renderLoading();
    }

    if (isError) {
      console.log("Rendering: Error State (Mock)", error);
      return renderError();
    }

    // Success state: Check if filteredOrders is available and has items
    if (filteredOrders && filteredOrders.length > 0) {
        console.log(`Rendering: Displaying ${filteredOrders.length} Mock Orders`);
       return renderOrdersList(filteredOrders);
    }

    // Success state but no orders (either initially empty or filtered to empty)
     console.log("Rendering: Empty State (Mock - No results or initially empty)");
    return renderEmpty();
  };

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
        <Card className="w-full max-w-5xl mx-auto card">
            <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                 <div>
                    <CardTitle className="text-2xl font-semibold">Orders</CardTitle>
                    <CardDescription>View and manage your mock story orders.</CardDescription>
                 </div>
                 <div className="flex flex-col md:flex-row items-center gap-2 w-full md:w-auto">
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground peer-focus:text-primary" />
                        <Input
                            type="search"
                            placeholder="Search by customer, ID, email, or summary..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 w-full peer" // Ensure peer class is applied
                        />
                    </div>
                    <Button asChild className="btn w-full md:w-auto shrink-0">
                        <Link href="/orders/new">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            New Order
                        </Link>
                    </Button>
                 </div>
            </CardHeader>
            <CardContent>
                {renderContent()}
            </CardContent>
        </Card>
    </div>
  );
};


// Wrap the component with the provider.
const OrdersPageWithProvider: FC = () => (
  <QueryClientProvider client={queryClient}>
    <OrdersPage />
  </QueryClientProvider>
);

export default OrdersPageWithProvider;
