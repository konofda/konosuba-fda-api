export const fetchAxelFile = async (filename) => {
  const url = `https://raw.githubusercontent.com/Assasans/axel/refs/heads/main/master/${filename}.json`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${filename}: ${response.status} ${response.statusText}`);
  }
  return response.json();
};
