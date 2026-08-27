import { notFound } from "next/navigation";
import { ComingSoonScreen } from "@/components/layout/ComingSoonScreen";
import { PLACEHOLDER_SECTIONS } from "@/lib/placeholder-sections";

export function generateStaticParams() {
  return Object.keys(PLACEHOLDER_SECTIONS).map((section) => ({ section }));
}

export default async function PlaceholderSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  const entry = PLACEHOLDER_SECTIONS[section];
  if (!entry) notFound();

  return <ComingSoonScreen title={entry.title} description={entry.description} />;
}
