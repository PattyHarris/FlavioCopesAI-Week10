import { notFound } from "next/navigation";

import { PublicSubscribeForm } from "./public-subscribe-form";
import { getPublicFormBySlugs } from "@/lib/public-forms";

type PageProps = {
  params: Promise<{
    newsletterSlug: string;
    formSlug: string;
  }>;
};

export default async function PublicFormPage({ params }: PageProps) {
  const { newsletterSlug, formSlug } = await params;

  try {
    const form = await getPublicFormBySlugs(newsletterSlug, formSlug);

    return (
      <div className="public-form-shell" style={{ backgroundColor: form.background_color ?? "#FFFFFF" }}>
        <div className="public-form-card" style={{ color: form.text_color ?? "#212529" }}>
          <p className="eyebrow">{form.newsletters.name}</p>
          <h1>{form.heading}</h1>
          <p className="muted-copy">{form.description ?? form.newsletters.description ?? "Sign up to stay updated."}</p>
          <PublicSubscribeForm
            formSlug={form.slug}
            newsletterSlug={form.newsletters.slug}
            submitLabel={form.submit_button_label}
          />
        </div>
      </div>
    );
  } catch {
    notFound();
  }
}
