export function createItemHelpers(itemCatalog, tierConfig) {
  function getCatalogItem(item) {
    return itemCatalog.get(item?.id);
  }

  function getItemIcon(item) {
    return getCatalogItem(item)?.icon || item?.icon || "assets/items/Item__00.png";
  }

  function getItemRequiredLevel(item) {
    return getCatalogItem(item)?.requiredLevel || item?.requiredLevel || 1;
  }

  function getItemTier(item) {
    return getCatalogItem(item)?.tier || item?.tier || 1;
  }

  function getItemTierConfig(item) {
    return tierConfig[getItemTier(item)] || tierConfig[1];
  }

  function getItemType(item) {
    return getCatalogItem(item)?.type || item?.type || "equipment";
  }

  function getItemEffect(item) {
    return getCatalogItem(item)?.effect || item?.effect || {};
  }

  function getItemDuration(item) {
    return getCatalogItem(item)?.durationMs || item?.durationMs || 0;
  }

  function getItemQuantity(item) {
    if (!Object.prototype.hasOwnProperty.call(item || {}, "quantity")) return 1;
    const quantity = Number(item.quantity);
    return Number.isFinite(quantity) ? Math.max(0, quantity) : 1;
  }

  return {
    getItemIcon,
    getItemRequiredLevel,
    getItemTier,
    getItemTierConfig,
    getItemType,
    getItemEffect,
    getItemDuration,
    getItemQuantity,
  };
}
