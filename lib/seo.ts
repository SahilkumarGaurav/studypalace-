import 'server-only';
import { config, abs } from './config';
import { categoryName, inr } from './format';
import type { Product } from './repo';

/**
 * seo.ts — SERVER ONLY.
 *
 * Every function here needs the database (it receives a Product row), so this
 * module is guarded by the `server-only` package. If a client component ever
 * imports from it by mistake, the build fails immediately instead of silently
 * bundling better-sqlite3 into the browser.
 *
 * Pure helpers (money, dates, categories) live in lib/format.ts.
 */

export function productJsonLd(product: Product) {
  const price = (Number(product.price_paise) / 100).toFixed(2);
  const cover = product.cover_url || abs(`/api/cover/${product.slug}.png`);
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: String(product.seo_description || product.subtitle || product.description || '').slice(0, 400),
    sku: product.id,
    category: categoryName(product.category),
    image: [cover],
    url: abs(`/p/${product.slug}`),
    brand: { '@type': 'Brand', name: config.site.name },
    offers: {
      '@type': 'Offer',
      url: abs(`/p/${product.slug}`),
      priceCurrency: 'INR',
      price,
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
      priceValidUntil: new Date(Date.now() + 365 * 864e5).toISOString().slice(0, 10),
      seller: { '@type': 'Organization', name: config.site.name },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: { '@type': 'MonetaryAmount', value: '0', currency: 'INR' },
        shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'IN' },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: { '@type': 'QuantitativeValue', minValue: 0, maxValue: 0, unitCode: 'DAY' },
          transitTime: { '@type': 'QuantitativeValue', minValue: 0, maxValue: 0, unitCode: 'DAY' },
        },
      },
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        applicableCountry: 'IN',
        returnPolicyCategory: 'https://schema.org/MerchantReturnNotSupported',
      },
    },
    ...(Number(product.rating_count)
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: Number(product.rating) || 4.8,
            reviewCount: Number(product.rating_count) || 1,
            bestRating: 5,
          },
        }
      : {}),
  };
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: abs(item.url),
    })),
  };
}

export function faqJsonLd(faqs: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: config.site.name,
    url: abs('/'),
    logo: abs('/icon-192.png'),
    description: config.site.description,
    email: config.site.supportEmail,
    address: { '@type': 'PostalAddress', addressCountry: 'IN' },
    sameAs: [],
  };
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: config.site.name,
    url: abs('/'),
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${abs('/shop')}?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function itemListJsonLd(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      url: abs(it.url),
    })),
  };
}

/** Kept for convenience so server pages can import money formatting from here. */
export { inr };
