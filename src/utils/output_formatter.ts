// TypeScript utility for formatting Module results and assessment data for the frontend

import { randomUUID } from 'crypto';

export interface Product {
  name: string;
  category?: string;
  description?: string;
  estimated_hs_code?: string;
  confirmed_hs_code?: string;
  confidence_score?: number;
  [key: string]: unknown;
}

export interface Certification {
  name: string;
  authority?: string;
  code?: string;
  [key: string]: unknown;
}

export interface Contacts {
  email?: string;
  phone?: string;
  address?: string;
  [key: string]: unknown;
}

export interface SocialLinks {
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  [key: string]: unknown;
}

export interface ModuleOutput {
  summary?: string;
  products?: Product[];
  certifications?: Certification[];
  contacts?: Contacts;
  confidence_score?: number;
  social_links?: SocialLinks;
  [key: string]: unknown;
}

export interface Assessment {
  summary?: string;
  products?: Product[];
  certifications?: Certification[];
  contacts?: Contacts;
  confidence_score?: number;
  social_links?: SocialLinks;
  mcp_outputs?: Record<string, ModuleOutput>;
  [key: string]: unknown;
}

export interface FormattedAssessment {
  summary: string;
  products: Product[];
  certifications: Certification[];
  contacts?: Contacts;
  confidence_score?: number;
  social_links?: SocialLinks;
  fallback_reason?: string;
  [key: string]: unknown;
}


/**
 * Aggregates and formats Module output and assessment record for frontend consumption.
 * Prioritizes Module data, falls back to assessment fields if needed.
 */
export function formatModuleResults(
  assessment: Assessment,
  mcpOutputs?: Record<string, ModuleOutput>
): FormattedAssessment {
  // Helper to extract a field from Modules or assessment
  function extractField<T extends keyof ModuleOutput>(field: T, fallback: ModuleOutput[T] = undefined) {
    if (mcpOutputs) {
      for (const key in mcpOutputs) {
        if (mcpOutputs[key] && mcpOutputs[key][field] !== undefined && mcpOutputs[key][field] !== null) {
          return mcpOutputs[key][field];
        }
      }
    }
    return assessment && assessment[field] !== undefined ? assessment[field] : fallback;
  }

  // Extract products (aggregate from all Modules, fallback to assessment)
  let products: Product[] = [];
  if (mcpOutputs) {
    for (const key in mcpOutputs) {
      if (Array.isArray(mcpOutputs[key]?.products)) {
        products = products.concat(mcpOutputs[key].products as Product[]);
      }
    }
  }
  if (products.length === 0 && Array.isArray(assessment?.products)) {
    products = assessment.products as Product[];
  }

  // Insert taxonomy override for known product families
  const CATEGORY_TAXONOMY: Record<string, string> = {
    "corn dog": "Frozen Snacks",
    "corndog": "Frozen Snacks",
    "snack pocket": "Prepared Meals",
    "cheeseburger": "Prepared Meals",
    "chicken pops": "Meat Snacks",
  };
  const normalizeCategory = (name: string): string => {
    const lower = name.toLowerCase();
    for (const key in CATEGORY_TAXONOMY) {
      if (lower.includes(key)) return CATEGORY_TAXONOMY[key];
    }
    return "Misc";
  };
  products = products.map(p => ({
    ...p,
    category: normalizeCategory(p.name),
  }));

  // Assign stable IDs and grouping by normalized category
  products = products.map(p => ({
    ...p,
    id: (p as any).id || randomUUID(),
  }));
  const groupedMap: Record<string, { groupId: string; items: Product[] }> = {};
  products.forEach(p => {
    const key = (p.category || p.name).toLowerCase().trim();
    if (!groupedMap[key]) {
      groupedMap[key] = { groupId: randomUUID(), items: [] };
    }
    groupedMap[key].items.push(p);
  });
  products = Object.values(groupedMap).flatMap(group =>
    group.items.map(item => ({ ...item, group_id: group.groupId }))
  );

  // Extract certifications (aggregate from all Modules, fallback to assessment)
  let certifications: Certification[] = [];
  if (mcpOutputs) {
    for (const key in mcpOutputs) {
      if (Array.isArray(mcpOutputs[key]?.certifications)) {
        certifications = certifications.concat(mcpOutputs[key].certifications as Certification[]);
      }
    }
  }
  if (certifications.length === 0 && Array.isArray(assessment?.certifications)) {
    certifications = assessment.certifications as Certification[];
  }

  // Extract summary, contacts, confidence, social links
  const summaryRaw = extractField('summary', 'No summary available.');
  const summary: string = typeof summaryRaw === 'string' && summaryRaw ? summaryRaw : 'No summary available.';
  const contacts = extractField('contacts');
  const confidence_score = extractField('confidence_score');
  const social_links = extractField('social_links');

  // Optionally fallback reason
  let fallback_reason = undefined;
  if (!summary || summary === 'No summary available.') {
    fallback_reason = 'Summary not available.';
  }

  return {
    summary,
    products,
    certifications,
    contacts,
    confidence_score,
    social_links,
    fallback_reason
  };
}
