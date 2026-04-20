import { SITE } from './seo';

export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE.name,
    legalName: 'Soft All Things LLC',
    url: SITE.url,
    logo: `${SITE.url}/logo.png`,
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
  image?: string;
  datePublished: string;
  dateModified?: string;
  author?: string;
  medical?: boolean;
}

export function articleSchema(props: ArticleSchemaProps) {
  const type = props.medical ? ['Article', 'MedicalWebPage'] : 'Article';
  const base = {
    '@context': 'https://schema.org',
    '@type': type,
    headline: props.title,
    description: props.description,
    url: props.url,
    image: props.image,
    datePublished: props.datePublished,
    dateModified: props.dateModified || props.datePublished,
    author: {
      '@type': 'Person',
      name: props.author || 'PoopCheck Team',
    },
    publisher: {
      '@type': 'Organization',
      name: SITE.name,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE.url}/logo.png`,
      },
    },
  };

  if (props.medical) {
    return {
      ...base,
      lastReviewed: props.dateModified || props.datePublished,
      audience: {
        '@type': 'Audience',
        audienceType: 'consumers',
      },
    };
  }
  return base;
}
