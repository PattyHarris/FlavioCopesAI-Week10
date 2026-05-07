import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type PublicNewsletter = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
};

type RawPublicForm = {
  id: string;
  name: string;
  slug: string;
  heading: string;
  description: string | null;
  submit_button_label: string;
  background_color: string | null;
  text_color: string | null;
  newsletters: PublicNewsletter | PublicNewsletter[];
};

export type PublicForm = Omit<RawPublicForm, "newsletters"> & {
  newsletters: PublicNewsletter;
};

export async function getPublicFormBySlugs(newsletterSlug: string, formSlug: string) {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("signup_forms")
    .select(
      `
        id,
        name,
        slug,
        heading,
        description,
        submit_button_label,
        background_color,
        text_color,
        newsletters!inner (
          id,
          name,
          slug,
          description
        )
      `,
    )
    .eq("slug", formSlug)
    .eq("newsletters.slug", newsletterSlug)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const rawForm = data as RawPublicForm;
  const newsletter = Array.isArray(rawForm.newsletters) ? rawForm.newsletters[0] : rawForm.newsletters;

  if (!newsletter) {
    throw new Error("Unable to load newsletter for public form.");
  }

  return {
    ...rawForm,
    newsletters: newsletter,
  } satisfies PublicForm;
}

export async function subscribeToPublicForm(input: {
  newsletterSlug: string;
  formSlug: string;
  email: string;
  firstName?: string;
  lastName?: string;
}) {
  const form = await getPublicFormBySlugs(input.newsletterSlug, input.formSlug);
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("subscribers")
    .upsert(
      {
        newsletter_id: form.newsletters.id,
        source_list_id: form.id,
        email: input.email.trim().toLowerCase(),
        first_name: input.firstName?.trim() || null,
        last_name: input.lastName?.trim() || null,
        status: "subscribed",
        subscribed_at: new Date().toISOString(),
      },
      {
        onConflict: "newsletter_id,email",
      },
    )
    .select("id, email")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    subscriber: data,
    form,
  };
}
