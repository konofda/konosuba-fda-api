import { fetchAxelFile } from "./fetchAxelFile.js";

const WARN_ON_TRANSLATION_COLLISIONS = false;

let translationMap = null;

const loadTranslations = async () => {
  if (translationMap !== null) {
    return translationMap;
  }

  const [assetnames, texts] = await Promise.all([fetchAxelFile("assetname"), fetchAxelFile("text")]);

  translationMap = {};
  const collisions = [];

  // Load assetnames first
  assetnames.forEach((item) => {
    translationMap[item.id] = item;
  });

  // Load texts and check for collisions
  texts.forEach((item) => {
    if (translationMap[item.id]) {
      collisions.push({
        id: item.id,
        assetname: translationMap[item.id].text_english,
        text: item.text_english,
      });
    }
    translationMap[item.id] = item;
  });

  if (collisions.length > 0 && WARN_ON_TRANSLATION_COLLISIONS) {
    console.warn("\n⚠️  Translation ID collisions detected:");
    collisions.forEach(({ id, assetname, text }) => {
      console.warn(`  ID: ${id}`);
      console.warn(`    assetname: "${assetname}"`);
      console.warn(`    text:      "${text}"`);
    });
    console.warn("\nUsing text.json values for these IDs\n");
  }

  return translationMap;
};

const stripHtmlTags = (text) => {
  return text.replace(/<[^>]*>/g, "");
};

export const processTextFields = async (data, { stripTags = false } = {}) => {
  const translations = await loadTranslations();

  const processValue = (value) => {
    if (typeof value !== "string" || value.length <= 4) {
      return value;
    }
    const translated = translations[value]?.text_english || value;
    return stripTags ? stripHtmlTags(translated) : translated;
  };

  const processObject = (obj) => {
    if (Array.isArray(obj)) {
      return obj.map((item) => processObject(item));
    }
    if (obj && typeof obj === "object") {
      const newObj = {};
      for (const [key, value] of Object.entries(obj)) {
        newObj[key] = processObject(value);
      }
      return newObj;
    }
    return processValue(obj);
  };

  return processObject(data);
};
