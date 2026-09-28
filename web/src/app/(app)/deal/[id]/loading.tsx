import { Skeleton } from "@/components/ui/Skeleton";

export default function LoadingDeal() {
  return (
    <div className="mx-auto max-w-app space-y-5 px-4 py-8" aria-busy="true">
      <p role="status" className="sr-only">
        Loading the deal…
      </p>
      <Skeleton className="h-52" />
      <Skeleton className="h-16" />
      <Skeleton className="h-40" />
      <Skeleton className="h-64" />
    </div>
  );
}
