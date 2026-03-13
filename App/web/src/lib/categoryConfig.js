export const CATEGORIES = [
  { value: "Produce", bg: "bg-green-100", text: "text-green-800" },
  { value: "Dairy", bg: "bg-blue-100", text: "text-blue-800" },
  { value: "Meat", bg: "bg-red-100", text: "text-red-800" },
  { value: "Seafood", bg: "bg-cyan-100", text: "text-cyan-800" },
  { value: "Grains", bg: "bg-amber-100", text: "text-amber-800" },
  { value: "Beverages", bg: "bg-purple-100", text: "text-purple-800" },
  { value: "Snacks", bg: "bg-orange-100", text: "text-orange-800" },
  { value: "Condiments", bg: "bg-yellow-100", text: "text-yellow-800" },
  { value: "Frozen", bg: "bg-sky-100", text: "text-sky-800" },
  { value: "Baking", bg: "bg-pink-100", text: "text-pink-800" },
  { value: "Canned", bg: "bg-stone-100", text: "text-stone-800" },
  { value: "Other", bg: "bg-gray-100", text: "text-gray-800" },
];

const styleMap = Object.fromEntries(
  CATEGORIES.map((c) => [c.value, `${c.bg} ${c.text}`])
);

export function getCategoryStyle(category) {
  return styleMap[category] || styleMap["Other"];
}
