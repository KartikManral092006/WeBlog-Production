import { Skeleton } from "@/components/ui/skeleton";
import { LoaderOne } from "@/components/ui/loader";

export default function LoadingForYou() {
  return (
    <div className="container mx-auto w-full max-w-6xl px-4 pb-10 pt-2 md:pb-12">
      <div className="mb-5 flex justify-center">
        <LoaderOne />
      </div>
      <div className="mb-7 border-b border-border/70 pb-4">
        <Skeleton className="h-11 w-56" />
        <Skeleton className="mt-2 h-5 w-72" />
      </div>

      <div className="space-y-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="grid grid-cols-[1fr_160px] gap-5 border-b border-border/70 pb-5">
            <div className="space-y-3">
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-4/5" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-40" />
            </div>
            <Skeleton className="h-28 w-full rounded-sm" />
          </div>
        ))}
      </div>
    </div>
  );
}
