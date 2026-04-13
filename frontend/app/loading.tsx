import { Skeleton } from "@/components/ui/skeleton";
import { LoaderOne } from "@/components/ui/loader";

export default function Loading() {
  return (
    <div className="container mx-auto w-full max-w-6xl px-4 py-6 md:py-8">
      <div className="mb-5 flex justify-center">
        <LoaderOne />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-12 w-40" />
      </div>

      <div className="mt-8 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="grid grid-cols-[1fr_160px] gap-5 border-b border-border/70 pb-5">
            <div className="space-y-3">
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-4/5" />
              <Skeleton className="h-5 w-3/4" />
            </div>
            <Skeleton className="h-28 w-full rounded-sm" />
          </div>
        ))}
      </div>
    </div>
  );
}
