import { DataSource } from 'typeorm';

import {
  WebsitePage,
  PageBlock,
  PageContent,
  PageSeo,
} from '@modules/website/entities/website-page.entity';

/**
 * Seeds a complete, working page-builder demo: a Home page (with header + footer
 * chrome and a full block layout) plus the standard supporting pages, all
 * published and cross-linked from the header/footer so there are no dead links.
 * Rendered at `/` (home) and `/p/<slug>` (the rest). Idempotent — upserts by slug.
 * Invoked by the main `db:seed`.
 */

const HERO_IMG =
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&h=700&q=75';
const img = (id: string, w = 1200, h = 800) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&h=${h}&q=75`;

// A few appetising food shots (same library the catalogue uses).
const SLIDE = {
  plates: img('1504674900247-0877df9cc836', 1400, 700),
  grill: img('1544025162-d76694265947', 1400, 700),
  dessert: img('1551024506-0bccd828d307', 1400, 700),
  table: img('1414235077428-338989a2e8c0', 1400, 700),
  brunch: img('1533089860892-a7c6f0a88666', 1400, 700),
};

let blockCounter = 0;
const block = (type: string, config: Record<string, unknown>): PageBlock => ({
  id: `seed-${type}-${++blockCounter}`,
  type,
  hidden: false,
  config,
});

// ── Shared chrome (lives on the Home page; used site-wide) ───────────────────

const HEADER = {
  brandName: '', // empty → falls back to the tenant's real restaurant name
  showSearch: true,
  showLocation: true,
  ctaLabel: 'Order now',
  ctaHref: '/',
  links: [
    { label: 'Menu', href: '/' },
    { label: 'About', href: '/p/about' },
    { label: 'Events', href: '/events' },
    { label: 'Contact', href: '/p/contact' },
  ],
};

const FOOTER = {
  logoUrl: '',
  about:
    'Fresh, chef-crafted plates made to order. Dine in, pick up, or get it delivered — whatever suits your table tonight.',
  columns: [
    {
      heading: 'Explore',
      links: [
        { label: 'Home', href: '/' },
        { label: 'Our Menu', href: '/' },
        { label: 'Events', href: '/events' },
        { label: 'Favorites', href: '/favorites' },
      ],
    },
    {
      heading: 'Company',
      links: [
        { label: 'About Us', href: '/p/about' },
        { label: 'Contact', href: '/p/contact' },
        { label: 'Careers', href: '/p/careers' },
      ],
    },
    {
      heading: 'Legal',
      links: [
        { label: 'Privacy Policy', href: '/p/privacy' },
        { label: 'Terms of Service', href: '/p/terms' },
      ],
    },
  ],
  socials: [
    { platform: 'Facebook', href: 'https://facebook.com' },
    { platform: 'Instagram', href: 'https://instagram.com' },
    { platform: 'Twitter', href: 'https://twitter.com' },
  ],
  copyright: `© ${new Date().getFullYear()} TableTab. All rights reserved.`,
};

const EMPTY_CHROME = {
  brandName: '',
  showSearch: true,
  showLocation: true,
  ctaLabel: 'Order now',
  ctaHref: '/',
  links: [],
};

// ── Page definitions ─────────────────────────────────────────────────────────

interface SeedPage {
  slug: string;
  title: string;
  seo: PageSeo;
  content: PageContent;
}

function homePage(): SeedPage {
  return {
    slug: 'home',
    title: 'Home',
    seo: {
      metaTitle: 'Order online — fresh, made to order',
      metaDescription:
        'Browse the menu, order for delivery or pickup, book a table, and catch our latest offers.',
    },
    content: {
      header: HEADER,
      footer: FOOTER,
      blocks: [
        block('banner-slider', {
          bannerSide: 'left',
          eyebrow: "Today's kitchen",
          title: 'Taste the difference, made to order',
          subtitle:
            'Chef-crafted plates from the freshest ingredients — ready for delivery, pickup, or your table.',
          ctaLabel: 'Order now',
          ctaHref: '/',
          tone: 'brand',
          bannerImage: HERO_IMG,
          autoplay: true,
          autoplaySeconds: 5,
          perView: 1,
          showArrows: true,
          images: [
            {
              url: SLIDE.plates,
              caption: 'Seasonal plates',
              href: '/',
              badge: 'New',
            },
            {
              url: SLIDE.grill,
              caption: 'From the grill',
              href: '/',
              badge: '',
            },
            {
              url: SLIDE.dessert,
              caption: 'Sweet endings',
              href: '/',
              badge: '',
            },
          ],
        }),
        block('image-slider', {
          title: 'Highlights',
          autoplay: true,
          autoplaySeconds: 4,
          perView: 1,
          showArrows: true,
          images: [
            {
              url: SLIDE.brunch,
              caption: 'Weekend brunch',
              href: '/',
              badge: 'Weekends',
            },
            {
              url: SLIDE.grill,
              caption: "Chef's specials",
              href: '/',
              badge: '20% Off',
            },
            {
              url: SLIDE.table,
              caption: 'Book your table',
              href: '/events',
              badge: '',
            },
          ],
        }),
        block('menu-slider', {
          title: 'Explore our menus',
          showArrows: true,
        }),
        block('featured-categories', {
          title: 'Order by category',
          layout: 'slider',
          limit: 8,
          showViewAll: true,
          showArrows: true,
        }),
        block('product-carousel', {
          title: 'Popular right now',
          itemIds: [],
          layout: 'slider',
          limit: 8,
          showArrows: true,
        }),
        block('promotions', {
          title: 'Featured picks',
          layout: 'slider',
          limit: 8,
          showArrows: true,
        }),
        block('reservation', {
          title: 'Reserve a table',
          subtitle: 'Pick a location and book your table in a few taps.',
          buttonLabel: 'Find a table',
          tone: 'light',
        }),
        block('events', {
          title: 'Host your event with us',
          subtitle:
            "Birthdays, weddings, private parties — tell us what you're planning.",
          buttonLabel: 'Plan an event',
          tone: 'brand',
        }),
        block('rich-cta', {
          heading: 'Hungry yet?',
          text: 'Browse the full menu and build your order — delivery, pickup, or dine-in.',
          ctaLabel: 'See the menu',
          ctaHref: '/',
          tone: 'brand',
        }),
      ],
    },
  };
}

/** A simple content page: hero + rich text (+ optional trailing blocks). */
function contentPage(
  slug: string,
  title: string,
  heroTitle: string,
  heroSubtitle: string,
  bodyHtml: string,
  metaDescription: string,
  trailing: PageBlock[] = [],
): SeedPage {
  return {
    slug,
    title,
    seo: { metaTitle: `${title} — TableTab`, metaDescription },
    content: {
      header: EMPTY_CHROME,
      footer: {},
      blocks: [
        block('hero', {
          title: heroTitle,
          subtitle: heroSubtitle,
          imageUrl: HERO_IMG,
          ctaLabel: '',
          ctaHref: '',
          align: 'center',
        }),
        block('rich-text', { html: bodyHtml, width: 'wide', align: 'left' }),
        ...trailing,
      ],
    },
  };
}

function allPages(): SeedPage[] {
  const about = contentPage(
    'about',
    'About Us',
    'Our story',
    'Good food, made with care — and served with a smile.',
    `<p>We started with a simple idea: real ingredients, cooked fresh, served fast. Every dish on our menu is prepared to order by chefs who care about the details.</p>
     <p>From our first tiny kitchen to the branches we run today, one thing hasn't changed — we treat every order like it's for someone we love.</p>
     <h3>What we believe</h3>
     <ul>
       <li><strong>Freshness first.</strong> We source daily and cook to order.</li>
       <li><strong>Everyone's welcome.</strong> Dine in, take out, or get it delivered.</li>
       <li><strong>Consistency counts.</strong> The same great plate, every single time.</li>
     </ul>`,
    'Learn about our story, our kitchen, and what we stand for.',
    [
      block('rich-cta', {
        heading: 'Come dine with us',
        text: 'Book a table or order online — we can’t wait to host you.',
        ctaLabel: 'Reserve a table',
        ctaHref: '/events',
        tone: 'brand',
      }),
    ],
  );

  const contact = contentPage(
    'contact',
    'Contact',
    'Get in touch',
    "Questions, feedback, or a big group booking? We'd love to hear from you.",
    `<p>Our team is here to help.</p>
     <h3>Reach us</h3>
     <ul>
       <li><strong>Phone:</strong> +1 (555) 010-2030</li>
       <li><strong>Email:</strong> hello@tabletab.dev</li>
       <li><strong>Hours:</strong> Mon–Sun, 11:00 AM – 10:00 PM</li>
     </ul>
     <p>For reservations, use the booking tool below — you'll get instant confirmation by email, no account needed.</p>`,
    'Get in touch with our team — phone, email, and opening hours.',
    [
      block('reservation', {
        title: 'Book a table',
        subtitle: 'Pick a location and reserve in a few taps.',
        buttonLabel: 'Find a table',
        tone: 'light',
      }),
    ],
  );

  const careers = contentPage(
    'careers',
    'Careers',
    'Join the team',
    'Love food and people? So do we.',
    `<p>We're always looking for friendly, dependable people to join our kitchens and front-of-house teams.</p>
     <h3>Open roles</h3>
     <ul>
       <li>Line Cook — full-time</li>
       <li>Server / Host — part-time</li>
       <li>Delivery Rider — flexible hours</li>
     </ul>
     <p>Interested? Email your CV to <strong>careers@tabletab.dev</strong> and tell us what you love to cook (or eat).</p>`,
    'Explore open roles and join our growing team.',
  );

  const privacy = contentPage(
    'privacy',
    'Privacy Policy',
    'Privacy Policy',
    'How we handle your information.',
    `<p>We collect only what we need to take and deliver your order — your name, contact details, and order history.</p>
     <h3>What we collect</h3>
     <ul>
       <li>Order and delivery details you provide at checkout.</li>
       <li>Basic usage data to keep the site fast and reliable.</li>
     </ul>
     <h3>What we don't do</h3>
     <p>We never sell your data. You can request deletion of your information at any time by contacting us.</p>
     <p><em>This is placeholder demo copy — replace it with your real policy before going live.</em></p>`,
    'Our privacy policy — what we collect and how we use it.',
  );

  const terms = contentPage(
    'terms',
    'Terms of Service',
    'Terms of Service',
    'The basics of using our service.',
    `<p>By placing an order you agree to these terms.</p>
     <h3>Orders</h3>
     <p>Prices and availability may change. We'll always confirm your order total before you pay.</p>
     <h3>Cancellations</h3>
     <p>Contact us as soon as possible to change or cancel an order. Once preparation begins, cancellation may not be possible.</p>
     <p><em>This is placeholder demo copy — replace it with your real terms before going live.</em></p>`,
    'Our terms of service — orders, cancellations, and more.',
  );

  return [homePage(), about, contact, careers, privacy, terms];
}

// ── Upsert ───────────────────────────────────────────────────────────────────

export async function seedWebsite(dataSource: DataSource): Promise<void> {
  console.log('\n🌐 Seeding website (page builder demo)...');
  const repo = dataSource.getRepository(WebsitePage);
  const now = new Date();

  for (const page of allPages()) {
    // Both draft + published are set so the builder shows it AND the storefront renders it.
    const existing = await repo.findOne({ where: { slug: page.slug } });
    if (existing) {
      existing.title = page.title;
      existing.content = page.content;
      existing.published = page.content;
      existing.seo = page.seo;
      existing.publishedAt = now;
      await repo.save(existing);
      console.log(`  🔁 Updated: ${page.slug}`);
    } else {
      await repo.save(
        repo.create({
          slug: page.slug,
          title: page.title,
          content: page.content,
          published: page.content,
          seo: page.seo,
          publishedAt: now,
        }),
      );
      console.log(`  ✅ Created: ${page.slug}`);
    }
  }
  console.log(
    '  🌐 Website demo ready (home + 5 pages, header/footer linked).',
  );
}
