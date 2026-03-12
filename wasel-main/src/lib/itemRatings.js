import { supabase } from '@/lib/supabase';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function toNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function normalizeId(value) {
  if (value === null || value === undefined) return '';
  const id = String(value).trim();
  return id;
}

function findItemId(item) {
  if (!item || typeof item !== 'object') return '';
  return normalizeId(item.id || item.item_id || item.product_id);
}

function readExistingRating(item) {
  const count = Math.max(0, toNumber(item?.review_count ?? item?.rating_count, 0));
  const average = toNumber(item?.avg_rating ?? item?.rating_avg ?? item?.rating, 0);
  return { average, count };
}

function applyRatingFields(item, average, count) {
  const safeAvg = Math.max(0, average);
  const safeCount = Math.max(0, Math.round(count));
  return {
    ...item,
    avg_rating: safeAvg,
    review_count: safeCount,
    rating_avg: safeAvg,
    rating_count: safeCount,
    rating: safeAvg,
  };
}

async function queryReviewsByColumn(column, ids, itemType) {
  if (!ids.length) return [];

  const runQuery = async (candidateIds, withType) => {
    if (!candidateIds.length) return { data: [], error: null };
    let query = supabase
      .from('reviews')
      .select(`${column}, rating`)
      .in(column, candidateIds)
      .gt('rating', 0);

    if (withType && itemType) {
      query = query.eq('item_type', itemType);
    }

    return query;
  };

  let { data, error } = await runQuery(ids, true);

  if (error && itemType) {
    // Fallback for schemas that do not include item_type in reviews.
    const fallback = await runQuery(ids, false);
    data = fallback.data;
    error = fallback.error;
  }

  if (error && error.code === '22P02') {
    const uuidOnly = ids.filter((id) => UUID_REGEX.test(id));
    if (uuidOnly.length > 0 && uuidOnly.length !== ids.length) {
      const retry = await runQuery(uuidOnly, Boolean(itemType));
      data = retry.data;
      error = retry.error;
    }
  }

  if (error) return [];
  return Array.isArray(data) ? data : [];
}

export async function attachRatingsFromReviews(items, options = {}) {
  const list = Array.isArray(items) ? items : [];
  if (!list.length) return [];

  const itemType = typeof options.itemType === 'string' ? options.itemType : null;
  const ids = Array.from(new Set(list.map(findItemId).filter(Boolean)));
  if (!ids.length) {
    return list.map((item) => {
      const existing = readExistingRating(item);
      return applyRatingFields(item, existing.average, existing.count);
    });
  }

  const [itemIdRows, productIdRows] = await Promise.all([
    queryReviewsByColumn('item_id', ids, itemType),
    queryReviewsByColumn('product_id', ids, itemType),
  ]);

  const ratingMap = new Map();

  const consumeRows = (rows, idKey) => {
    rows.forEach((row) => {
      const key = normalizeId(row?.[idKey]);
      if (!key) return;
      const rating = toNumber(row?.rating, 0);
      if (rating <= 0) return;

      const current = ratingMap.get(key) || { sum: 0, count: 0 };
      current.sum += rating;
      current.count += 1;
      ratingMap.set(key, current);
    });
  };

  consumeRows(itemIdRows, 'item_id');
  consumeRows(productIdRows, 'product_id');

  return list.map((item) => {
    const key = findItemId(item);
    const aggregate = ratingMap.get(key);
    if (aggregate && aggregate.count > 0) {
      return applyRatingFields(item, aggregate.sum / aggregate.count, aggregate.count);
    }

    const existing = readExistingRating(item);
    return applyRatingFields(item, existing.average, existing.count);
  });
}

export function normalizeItemRating(item) {
  const existing = readExistingRating(item);
  return applyRatingFields(item, existing.average, existing.count);
}
