export const USER_REGION_KEY = 'wasel_user_region';

export const USER_REGIONS = {
  INSIDE_SYRIA: 'inside_syria',
  OUTSIDE_SYRIA: 'outside_syria',
};

export function getUserRegion() {
  try {
    const value = localStorage.getItem(USER_REGION_KEY);
    if (value === USER_REGIONS.INSIDE_SYRIA || value === USER_REGIONS.OUTSIDE_SYRIA) {
      return value;
    }
    return null;
  } catch (error) {
    console.error('Failed to read user region:', error);
    return null;
  }
}

export function setUserRegion(region) {
  if (region !== USER_REGIONS.INSIDE_SYRIA && region !== USER_REGIONS.OUTSIDE_SYRIA) {
    return false;
  }

  try {
    localStorage.setItem(USER_REGION_KEY, region);
    return true;
  } catch (error) {
    console.error('Failed to save user region:', error);
    return false;
  }
}

export function isInsideSyria(region) {
  return region === USER_REGIONS.INSIDE_SYRIA;
}
