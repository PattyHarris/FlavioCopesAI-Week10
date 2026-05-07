import { redirect } from "next/navigation";

import { CreateCampaign } from "./create-campaign";
import { getCampaignsForOwnedNewsletter } from "@/lib/newsletters";

type PageProps = {
  params: Promise<{
    newsletterId: string;
  }>;
};

export default async function CampaignsPage({ params }: PageProps) {
  const { newsletterId } = await params;
  try {
    const { newsletter, campaigns, segments, subscriberCount } = await getCampaignsForOwnedNewsletter(newsletterId);

    return (
      <>
        <section className="card">
          <p className="eyebrow">Campaigns</p>
          <h2>{newsletter.name}: compose, target, send, and track</h2>
          <p className="muted-copy">
            This first pass focuses on real draft creation. If no segment is selected, the campaign targets all
            subscribers in the newsletter.
          </p>
        </section>
        <CreateCampaign
          initialCampaigns={campaigns}
          newsletterSlug={newsletter.slug}
          segments={segments}
          subscriberCount={subscriberCount}
        />
      </>
    );
  } catch {
    redirect("/app");
  }
}
