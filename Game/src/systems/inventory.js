export function normalizeItemIconPath(iconPath) {
  if (typeof iconPath !== "string") return iconPath;
  return iconPath
    .replace("assets/items2/", "assets/item-icons/pack2-")
    .replace("assets/items3/", "assets/item-icons/pack3-")
    .replace("assets/items/", "assets/item-icons/pack1-")
    .replace("assets/boots/", "assets/item-icons/boot-")
    .replace("assets/materials/", "assets/item-icons/material-");
}

export function createItemHelpers(itemCatalog, tierConfig) {
  function getCatalogItem(item) {
    return itemCatalog.get(item?.id);
  }

  function getItemIcon(item) {
    return normalizeItemIconPath(getCatalogItem(item)?.icon || item?.icon || "assets/item-icons/pack1-Item__00.png");
  }

  function getItemRequiredLevel(item) {
    return getCatalogItem(item)?.requiredLevel || item?.requiredLevel || 1;
  }

  function getItemTier(item) {
    const catalogItem = getCatalogItem(item);
    const itemType = catalogItem?.type || item?.type;
    const craftTier = Number(item?.craftTier);
    if (itemType === "material" && Number.isFinite(craftTier)) {
      return Math.min(15, Math.max(1, Math.round(craftTier)));
    }
    return catalogItem?.tier || item?.tier || 1;
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


