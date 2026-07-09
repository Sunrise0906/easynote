import type { Metadata } from "next";
import ReviewSession from "@/components/app/ReviewSession";

export const metadata: Metadata = { title: "Review" };

export default function ReviewPage() {
  return <ReviewSession />;
}
