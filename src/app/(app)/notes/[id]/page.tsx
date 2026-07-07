import NoteWorkspace from "@/components/app/NoteWorkspace";

export default async function NotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <NoteWorkspace noteId={id} />;
}
