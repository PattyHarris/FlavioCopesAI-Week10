import { redirect } from "next/navigation";

import { CreateForm } from "./create-form";
import { getFormsForOwnedNewsletter } from "@/lib/newsletters";

type PageProps = {
  params: Promise<{
    newsletterId: string;
  }>;
};

export default async function FormsPage({ params }: PageProps) {
  const { newsletterId } = await params;
  try {
    const { newsletter, forms } = await getFormsForOwnedNewsletter(newsletterId);

    return (
      <>
        <section className="card">
          <p className="eyebrow">Forms</p>
          <h2>{newsletter.name}: hosted forms and embeddable widgets</h2>
          <p className="muted-copy">Create hosted signup points and reuse them across campaigns and audience reports.</p>
        </section>
        <CreateForm initialForms={forms} newsletterSlug={newsletter.slug} />
      </>
    );
  } catch {
    redirect("/app");
  }
}
