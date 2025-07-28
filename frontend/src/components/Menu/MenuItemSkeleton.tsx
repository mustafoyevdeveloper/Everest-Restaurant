import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const MenuItemSkeleton = () => {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="h-32 sm:h-48 w-full" />
      <CardContent className="p-3 sm:p-4">
        <Skeleton className="h-3 sm:h-4 w-2/3 mb-2" />
        <Skeleton className="h-3 sm:h-4 w-full mb-3 sm:mb-4" />
        <Skeleton className="h-3 sm:h-4 w-1/3" />
      </CardContent>
      <CardFooter className="p-3 sm:p-4 flex justify-between items-center">
        <Skeleton className="h-3 sm:h-4 w-1/4" />
        <Skeleton className="h-6 sm:h-8 w-20 sm:w-24" />
      </CardFooter>
    </Card>
  );
};

export default MenuItemSkeleton; 