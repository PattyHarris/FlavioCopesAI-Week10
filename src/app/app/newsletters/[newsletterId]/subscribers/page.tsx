import { redirect } from "next/navigation";

import { getSubscribersForOwnedNewsletter } from "@/lib/newsletters";

type PageProps = {
  params: Promise<{
    newsletterId: string;
  }>;
};

export default async function SubscribersPage({ params }: PageProps) {
  const { newsletterId } = await params;
  try {
    const { newsletter, subscribers } = await getSubscribersForOwnedNewsletter(newsletterId);

    return (
      <>
        <section className="card">
          <p className="eyebrow">Subscribers</p>
          <h2>{newsletter.name}: single audience pool</h2>
          <p className="muted-copy">Track one newsletter audience with source attribution preserved from signup through sending.</p>
        </section>

        <section className="stats-grid">
          <article className="card stat-card">
            <p className="eyebrow">Total subscribers</p>
            <h3>{subscribers.length.toLocaleString()}</h3>
            <p className="muted-copy">Live count for this newsletter</p>
          </article>
          <article className="card stat-card">
            <p className="eyebrow">Subscribed</p>
            <h3>{subscribers.filter((subscriber) => subscriber.status === "subscribed").length}</h3>
            <p className="muted-copy">Currently active audience members</p>
          </article>
          <article className="card stat-card">
            <p className="eyebrow">Sources tracked</p>
            <h3>{new Set(subscribers.map((subscriber) => subscriber.sourceFormName)).size}</h3>
            <p className="muted-copy">Distinct form or import origins</p>
          </article>
        </section>

        <section className="card">
          <p className="eyebrow">Audience</p>
          <div className="table-list">
            {subscribers.length === 0 ? (
              <div className="table-row">
                <div>
                  <strong>No subscribers yet</strong>
                  <p className="muted-copy">Open a hosted form and submit it to watch the audience appear here.</p>
                </div>
              </div>
            ) : (
              subscribers.map((subscriber) => (
                <div className="table-row table-row-rich" key={subscriber.id}>
                  <div>
                    <strong>
                      {subscriber.first_name || subscriber.last_name
                        ? `${subscriber.first_name ?? ""} ${subscriber.last_name ?? ""}`.trim()
                        : subscriber.email}
                    </strong>
                    <p className="muted-copy">{subscriber.email}</p>
                  </div>
                  <div className="subscriber-meta">
                    <span className="badge">{subscriber.status}</span>
                    <p className="muted-copy">Source: {subscriber.sourceFormName}</p>
                    <p className="muted-copy">
                      Joined{" "}
                      {new Intl.DateTimeFormat("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      }).format(new Date(subscriber.subscribed_at))}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </>
    );
  } catch {
    redirect("/app");
  }
}
