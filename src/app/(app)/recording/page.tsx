import type { Metadata } from "next";
import Recorder from "@/components/app/Recorder";

export const metadata: Metadata = { title: "Record" };

export default function RecordingPage() {
  return <Recorder />;
}
