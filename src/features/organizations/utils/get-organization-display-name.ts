import {
  DEFAULT_ORGANIZATION_NAME,
  DEFAULT_ORGANIZATION_SLUG,
} from "@/features/organizations/constants";

export function getOrganizationDisplayName(org: {
  name: string;
  slug: string;
}): string {
  return org.slug === DEFAULT_ORGANIZATION_SLUG &&
    org.name !== DEFAULT_ORGANIZATION_NAME
    ? `${org.name} (default)`
    : org.name;
}
