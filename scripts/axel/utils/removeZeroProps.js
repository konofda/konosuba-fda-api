export function removeZeroProps(data) {
  if (Array.isArray(data)) {
    return data.map((item) => {
      if (typeof item === "object" && item !== null) {
        const newItem = { ...item };
        for (const [key, value] of Object.entries(newItem)) {
          if (value === "0") {
            delete newItem[key];
          } else if (typeof value === "object" && value !== null) {
            newItem[key] = removeZeroProps(value);
          }
        }
        return newItem;
      }
      return item;
    });
  }
  return data;
}
