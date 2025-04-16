// Sample HS code data for demonstration purposes
// In a real application, this would be loaded from a CSV file or API

export interface HsCodeItem {
  code: string;
  name: string;
}

// Chapters (2-digit)
export const chapters: HsCodeItem[] = [
  { code: '22', name: 'Beverages, spirits and vinegar' },
  { code: '09', name: 'Coffee, tea, maté and spices' },
  { code: '44', name: 'Wood and articles of wood; wood charcoal' },
  { code: '08', name: 'Edible fruit and nuts; peel of citrus fruit or melons' },
  { code: '71', name: 'Natural or cultured pearls, precious or semi-precious stones, precious metals' },
  { code: '84', name: 'Machinery, mechanical appliances, nuclear reactors, boilers; parts thereof' },
];

// Headings (4-digit)
export const headings: Record<string, HsCodeItem[]> = {
  '22': [
    { code: '2204', name: 'Wine of fresh grapes, including fortified wines' },
    { code: '2208', name: 'Spirits, liqueurs and other spirituous beverages' },
    { code: '2201', name: 'Waters, including natural or artificial mineral waters' },
    { code: '2202', name: 'Waters, including mineral waters and aerated waters, containing added sugar' },
  ],
  '09': [
    { code: '0902', name: 'Tea, whether or not flavoured' },
    { code: '0901', name: 'Coffee, whether or not roasted or decaffeinated' },
    { code: '0904', name: 'Pepper of the genus Piper; dried or crushed or ground fruits of the genus Capsicum or Pimenta' },
    { code: '0905', name: 'Vanilla' },
  ],
  // ... add more headings as needed
};

// Subheadings (6-digit)
export const subheadings: Record<string, HsCodeItem[]> = {
  '2204': [
    { code: '220421', name: 'In containers holding 2 litres or less' },
    { code: '220429', name: 'Other' },
  ],
  '0902': [
    { code: '090210', name: 'Green tea (not fermented) in immediate packings of a content not exceeding 3 kg' },
    { code: '090220', name: 'Other green tea (not fermented)' },
  ],
  // ... add more subheadings as needed
};

// Sample Products
export const sampleProducts = [
  {
    id: 1,
    name: 'Premium Red Wine',
    description: 'A high-quality red wine produced in South Africa',
    hsCode: '',
    hsCodeDescription: '',
  },
  {
    id: 2,
    name: 'Roasted Coffee Beans',
    description: 'Arabica coffee beans, expertly roasted for export',
    hsCode: '',
    hsCodeDescription: '',
  },
];
