import { getOrigin } from "@/lib/origin";
import { DealClient } from "./DealClient";

export default async function DealPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DealClient id={id} origin={await getOrigin()} />;
}
