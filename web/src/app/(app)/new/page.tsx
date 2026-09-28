import type { Metadata } from "next";
import { CreateDealFlow } from "./CreateDealFlow";

export const metadata: Metadata = {
  title: "Create a deposit link",
  description: "Lock your tenant's deposit until the key handover. You're paid the moment they scan your code at the door.",
};

export default function NewDealPage() {
  return <CreateDealFlow />;
}
