
import type { FC } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ChevronRight, AlertCircle, Info, CheckCircle, Loader2, PackageCheck, BookOpen, Sparkles, FileText, AlertOctagon, UserCheck } from 'lucide-react'; // Added stage icons, UserCheck
import type { Order, OrderStatus, OrderStage } from '@/types/order'; // Added OrderStage
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card'; // Removed CardHeader, Title, Description as not used
import { cn } from '@/lib/utils';

interface OrderCardProps {
  order: Order;
}

const shortenId = (id: string, length = 8): string => {
  return id.length > length ? `${id.substring(0, length)}...` : id;
};

// Updated status styles to include 'delivered'
const statusStyles: Record<OrderStatus, { variant: BadgeProps['variant'], icon: React.ReactNode, label: string }> = {
  pending: { variant: 'secondary', icon: <Info className="mr-1 h-3 w-3" />, label: 'Pending' },
  in_progress: { variant: 'default', icon: <Loader2 className="mr-1 h-3 w-3 animate-spin" />, label: 'In Progress' },
  completed: { variant: 'outline', icon: <CheckCircle className="mr-1 h-3 w-3 text-green-600" />, label: 'Ready' }, // Shortened label
  failed: { variant: 'destructive', icon: <AlertCircle className="mr-1 h-3 w-3" />, label: 'Failed' },
  delivered: { variant: 'outline', icon: <PackageCheck className="mr-1 h-3 w-3 text-primary" />, label: 'Delivered' }, // Added delivered
};

// Styles for Order Stage (simplified labels for card view) - Added 'character_sheet_generation'
const stageStyles: Record<OrderStage, { variant: BadgeProps['variant'], icon: React.ReactNode, label: string }> = {
    character_sheet_generation: { variant: 'default', icon: <UserCheck className="mr-1 h-3 w-3" />, label: 'Character Sheet' }, // NEW Stage
    pending_approval: { variant: 'secondary', icon: <Info className="mr-1 h-3 w-3" />, label: 'Approval' },
    story_content_generation: { variant: 'default', icon: <BookOpen className="mr-1 h-3 w-3" />, label: 'Text Gen' },
    visual_content_generation: { variant: 'default', icon: <Sparkles className="mr-1 h-3 w-3" />, label: 'Visual Gen' },
    final_review: { variant: 'default', icon: <FileText className="mr-1 h-3 w-3" />, label: 'Review' },
    completed: { variant: 'outline', icon: <CheckCircle className="mr-1 h-3 w-3 text-green-600" />, label: 'Ready' },
    failed: { variant: 'destructive', icon: <AlertOctagon className="mr-1 h-3 w-3" />, label: 'Failed' },
    delivered: { variant: 'outline', icon: <PackageCheck className="mr-1 h-3 w-3 text-primary" />, label: 'Delivered' },
};


// Helper function to format timestamp safely, returning 'N/A' on error
const formatTimestampSafe = (ts: Order['createdAt']): string => {
    if (!ts) return 'N/A';
    try {
        // Check if it's a Firestore Timestamp-like object
        if (typeof ts === 'object' && ts !== null && typeof (ts as any).toDate === 'function') {
            const date = (ts as any).toDate();
             if (!(date instanceof Date) || isNaN(date.getTime())) {
                return 'Invalid Date';
             }
            return format(date, 'dd MMM yyyy');
        }
         // Check if it's a simple object { seconds: number, nanoseconds: number }
         else if (typeof ts === 'object' && ts !== null && 'seconds' in ts && typeof ts.seconds === 'number') {
             const date = new Date(ts.seconds * 1000);
             if (isNaN(date.getTime())) {
                 return 'Invalid Date';
             }
             return format(date, 'dd MMM yyyy');
         }
         // Try parsing if it's a string or number
         else if (typeof ts === 'string' || typeof ts === 'number') {
             const date = new Date(ts);
             if (isNaN(date.getTime())) {
                return 'Invalid Date';
            }
            return format(date, 'dd MMM yyyy');
         }
        return 'N/A'; // Fallback if type is unexpected
    } catch (error) {
        console.error("Error formatting timestamp in OrderCard:", error, ts);
        return 'N/A';
    }
};


const OrderCard: FC<OrderCardProps> = ({ order }) => {
  const statusConfig = statusStyles[order.status] || statusStyles.pending;
  const stageConfig = stageStyles[order.stage] || stageStyles.pending_approval; // Get stage config

  // Use the safe formatting function
  const formattedDate = formatTimestampSafe(order.createdAt);

  // Determine if the stage badge should be shown (only when status is pending or in_progress)
  const showStageBadge = order.status === 'pending' || order.status === 'in_progress';

  return (
    <Link href={`/orders/${order.id}`} passHref legacyBehavior>
      <a className="block group transition-all duration-200 ease-in-out hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-lg">
        <Card className="card cursor-pointer overflow-hidden transition-shadow duration-200 group-hover:shadow-md">
          <CardContent className="p-4 flex items-center justify-between space-x-4">
            {/* Left Side: Basic Info */}
            <div className="flex-grow overflow-hidden">
              <p className="text-sm font-medium text-foreground truncate" title={order.customerName}>
                {order.customerName}
              </p>
              <p className="text-xs text-muted-foreground truncate" title={order.orderSummary}>
                {order.orderSummary || 'No summary'} {/* Handle potential missing summary */}
              </p>
              <div className="flex items-center space-x-2 mt-1">
                 <p className="text-xs text-muted-foreground">ID: {shortenId(order.id)}</p>
                 <span className="text-xs text-muted-foreground" aria-hidden="true">·</span>
                 <p className="text-xs text-muted-foreground">{formattedDate}</p>
              </div>
            </div>

            {/* Right Side: Stage Badge (Conditional) + Status Badge + Arrow */}
            <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
              {/* Stage Badge (Conditional) */}
              {showStageBadge && (
                <Badge variant={stageConfig.variant} className="text-[10px] sm:text-xs py-0.5 px-1.5 sm:px-2 capitalize flex items-center whitespace-nowrap">
                  {stageConfig.icon}
                  {stageConfig.label}
                </Badge>
              )}
              {/* Status Badge */}
               <Badge variant={statusConfig.variant} className="text-[10px] sm:text-xs py-0.5 px-1.5 sm:px-2 capitalize flex items-center whitespace-nowrap">
                 {/* No icon for status to save space */}
                 {statusConfig.label}
               </Badge>
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground transition-transform duration-200 group-hover:translate-x-1" />
            </div>
          </CardContent>
        </Card>
      </a>
    </Link>
  );
};

export default OrderCard;
