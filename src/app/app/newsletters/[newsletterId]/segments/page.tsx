import { redirect } from "next/navigation";

import { CreateSegment } from "./create-segment";
import { getSegmentsForOwnedNewsletter } from "@/lib/newsletters";

type PageProps = {
  params: Promise<{
    newsletterId: string;
  }>;
};

export default async function SegmentsPage({ params }: PageProps) {
  const { newsletterId } = await params;
  try {
    const { newsletter, forms, segments } = await getSegmentsForOwnedNewsletter(newsletterId);

    return (
      <>
        <section className="card">
          <p className="eyebrow">Segments</p>
          <h2>{newsletter.name}: rule-based audience filters</h2>
          <p className="muted-copy">Build reusable audience slices from form source, subscriber state, or signup timing.</p>
        </section>
        <CreateSegment forms={forms} initialSegments={segments} newsletterSlug={newsletter.slug} />
      </>
    );
  } catch {
    redirect("/app");
  }
}
