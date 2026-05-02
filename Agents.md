# Starter Prompt

Build me a newsletter platform called "What's new". Users sign up, create newsletters, manage subscribers, build signup forms, write campaigns, and send emails.

The app needs:

- User accounts with registration and login (email + password)
- Multiple newsletters per user, each with its own subscribers, forms, and campaigns
- A single subscriber pool per newsletter (subscribers belong to the newsletter, not to individual forms)
- Signup forms as entry points: each form has a public URL, customizable colors, heading, description
- Audience segments: rule-based filters over subscribers (e.g. "signed up after March 1" or "from landing page")
- A campaign editor: subject line, rich text body, recipient selection (all subscribers or specific segments)
- Email sending via Resend (or another email API)
- Delivery tracking: track sent, delivered, opened, clicked, bounced status per email
- A dashboard per newsletter showing subscriber count, form count, campaign count, and recent campaigns
- Responsive layout with a sidebar navigation on desktop and off-canvas menu on mobile

Database structure:

- Users have many newsletters
- Newsletters have many subscribers, forms (lists), segments, campaigns
- Campaigns have many email deliveries (one per recipient)
- Subscribers track which form they signed up through (source_list_id)
- Segments store rules as JSON and resolve matching subscribers dynamically

## User Interface

See the mcp server running in this folder that points to a Stitch MCP server.  The UI is a starting point with a color palette noted next.  See also the font selections listed next.  In particular, the landing page, other page side bar design, edit page designs are good. I want a clean, document-like interface.

Make it feel like a real product, not a demo.

### Color Palette

Use the following color palette:

Professional/Minimalist (Focus on Readability):
Background: #FFFFFF (White) or #F8F9FA (Soft Gray)
Text: #212529 (Dark Gray/Black)
Neutral: #4B5563
Primary Color: #312E81
Secondary Color: #6366F1
Action Button: #9a1919 (e.g. Delete)

### Font

Use the fonts here:

Combine a distinct font for headings (like Oswald or Poppins) with a clean serif or sans-serif for the body text.

## Tech Stack

Use the following tech stack:

- Next.js, Typescript
- shadcn/ui (for newsletter editor)
- Resend (for mail)
- Supabase (for database)
- Stripe (for payment)
- Render (for remote deployment)

