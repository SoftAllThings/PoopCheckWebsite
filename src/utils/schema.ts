import { SITE } from './seo';

/** Absolute URL for any site-relative asset path. Schema.org requires absolute. */
export function absoluteUrl(path: string): string {
  return path.startsWith('http') ? path : `${SITE.url}${path.startsWith('/') ? path : `/${path}`}`;
}

/**
 * A full ImageObject rather than a bare URL string. Google uses width/height and
 * caption to decide whether an image is eligible for rich results and Google Images.
 */
export function imageObject(props: {
  url: string;
  width?: number;
  height?: number;
  caption?: string;
}) {
  return {
    '@type': 'ImageObject',
    url: absoluteUrl(props.url),
    contentUrl: absoluteUrl(props.url),
    width: props.width ?? SITE.imageWidth,
    height: props.height ?? SITE.imageHeight,
    ...(props.caption ? { caption: props.caption } : {}),
  };
}

export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE.name,
    legalName: 'Soft All Things LLC',
    url: SITE.url,
    logo: imageObject({ url: SITE.logo, width: 600, height: 600, caption: `${SITE.name} logo` }),
    image: imageObject({ url: SITE.image, caption: SITE.description }),
    description: SITE.description,
    email: 'poopcheck@softallthings.com',
    foundingDate: '2025-01',
    parentOrganization: {
      '@type': 'Organization',
      name: 'Soft All Things LLC',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: 'poopcheck@softallthings.com',
      availableLanguage: ['English'],
    },
  };
}

export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE.name,
    url: SITE.url,
    description: SITE.description,
    publisher: {
      '@type': 'Organization',
      name: SITE.name,
    },
  };
}

export function softwareApplicationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'MobileApplication',
    name: 'PoopCheck: AI Stool Tracker',
    operatingSystem: 'iOS, Android',
    applicationCategory: 'HealthApplication',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '80',
      bestRating: '5',
      worstRating: '1',
    },
    offers: [
      {
        '@type': 'Offer',
        name: 'PoopCheck Free',
        price: '0',
        priceCurrency: 'USD',
      },
      {
        '@type': 'Offer',
        name: 'PoopCheck Premium (Monthly)',
        price: '6.99',
        priceCurrency: 'USD',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: '6.99',
          priceCurrency: 'USD',
          billingIncrement: 1,
          unitText: 'MONTH',
        },
      },
      {
        '@type': 'Offer',
        name: 'PoopCheck Premium (Annual)',
        price: '49.99',
        priceCurrency: 'USD',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: '49.99',
          priceCurrency: 'USD',
          billingIncrement: 1,
          unitText: 'YEAR',
        },
      },
    ],
    description: SITE.description,
    url: SITE.url,
    downloadUrl: SITE.appStore,
  };
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function breadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export interface FAQItem {
  question: string;
  answer: string;
}

export function faqSchema(items: FAQItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

export interface ServiceSchemaProps {
  name: string;
  description: string;
  url: string;
  serviceType?: string;
}

export function serviceSchema(props: ServiceSchemaProps) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: props.name,
    description: props.description,
    url: props.url,
    serviceType: props.serviceType,
    provider: {
      '@type': 'Organization',
      name: SITE.name,
      url: SITE.url,
    },
    areaServed: 'Worldwide',
  };
}

export interface ArticleSchemaProps {
  title: string;
  description: string;
  url: string;
  /** Primary image. Falls back to the site card so `image` is never absent. */
  image?: string;
  imageAlt?: string;
  /** Extra in-article images to declare for Google Images. */
  images?: Array<{ url: string; width?: number; height?: number; caption?: string }>;
  datePublished: string;
  dateModified?: string;
  author?: string;
  medical?: boolean;
}

export function articleSchema(props: ArticleSchemaProps) {
  const type = props.medical ? ['Article', 'MedicalWebPage'] : 'Article';
  const primary = imageObject({
    url: props.image || SITE.image,
    caption: props.imageAlt || props.title,
  });
  const extra = (props.images || []).map(imageObject);
  const base = {
    '@context': 'https://schema.org',
    '@type': type,
    headline: props.title,
    description: props.description,
    url: props.url,
    image: extra.length ? [primary, ...extra] : primary,
    datePublished: props.datePublished,
    dateModified: props.dateModified || props.datePublished,
    // "PoopCheck Team" is an organization, not a person. Typing it as Person
    // was a schema mismatch Rich Results flags, and on YMYL health content a
    // fake person reads worse than an honest corporate byline. A real personal
    // name (once we have one) still emits Person.
    author:
      props.author && props.author !== 'PoopCheck Team'
        ? { '@type': 'Person', name: props.author }
        : { '@type': 'Organization', name: SITE.name, url: SITE.url },
    publisher: {
      '@type': 'Organization',
      name: SITE.name,
      logo: imageObject({ url: SITE.logo, width: 600, height: 600, caption: `${SITE.name} logo` }),
    },
  };

  if (props.medical) {
    return {
      ...base,
      // `lastReviewed` deliberately omitted. On MedicalWebPage it asserts that
      // a medical review took place; we were emitting dateModified under that
      // name, which claims an editorial process that doesn't exist. Re-add it
      // only when a named reviewer actually reviews the post.
      audience: {
        '@type': 'Audience',
        audienceType: 'consumers',
      },
    };
  }
  return base;
}
