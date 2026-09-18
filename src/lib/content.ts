import type { ImageMetadata } from 'astro';
import { getCollection, getEntry } from 'astro:content';
import {
  groupByCategory,
  normalizeCategory,
  normalizePiece,
  publishedSorted,
  sortCategories,
  type Category,
  type Piece,
  type Section,
} from './pieces';
import { contactSchema, homeBaseSchema, settingsSchema, type ContactData, type HomeData, type SettingsData } from './schemas';

export async function loadSettings(): Promise<SettingsData> {
  const entry = await getEntry('settings', 'settings');
  return entry?.data ?? settingsSchema.parse({});
}

export async function loadHome(): Promise<HomeData & { portrait: ImageMetadata | null }> {
  const entry = await getEntry('home', 'home');
  return entry?.data ?? { ...homeBaseSchema.parse({}), portrait: null };
}

export async function loadContact(): Promise<ContactData> {
  const entry = await getEntry('contact', 'contact');
  return entry?.data ?? contactSchema.parse({});
}

export async function loadCategories(): Promise<Category[]> {
  const entries = await getCollection('categories');
  return sortCategories(entries.map((entry) => normalizeCategory(entry.id, entry.data)));
}

export async function loadPieces(): Promise<Piece[]> {
  const entries = await getCollection('pieces');
  return publishedSorted(entries.map((entry) => normalizePiece(entry.id, entry.data)));
}

export async function loadSections(): Promise<Section[]> {
  const [pieces, categories] = await Promise.all([loadPieces(), loadCategories()]);
  return groupByCategory(pieces, categories);
}
