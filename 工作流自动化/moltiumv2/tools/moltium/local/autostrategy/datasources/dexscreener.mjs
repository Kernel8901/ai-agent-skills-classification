import {
  getTokenBoostsTop,
  getTokenBoostsLatest,
  getAdsLatest,
  getTokenProfilesLatest,
} from '../../dexscreenerAPI/client.mjs';

export async function dexscreenerBoostsTop() {
  const json = await getTokenBoostsTop();
  return Array.isArray(json) ? json : (Array.isArray(json?.data) ? json.data : json);
}

export async function dexscreenerBoostsLatest() {
  const json = await getTokenBoostsLatest();
  return Array.isArray(json) ? json : (Array.isArray(json?.data) ? json.data : json);
}

export async function dexscreenerAdsLatest() {
  const json = await getAdsLatest();
  return Array.isArray(json) ? json : (Array.isArray(json?.data) ? json.data : json);
}

export async function dexscreenerTokenProfilesLatest() {
  const json = await getTokenProfilesLatest();
  return Array.isArray(json) ? json : (Array.isArray(json?.data) ? json.data : json);
}

// (search trend removed)
