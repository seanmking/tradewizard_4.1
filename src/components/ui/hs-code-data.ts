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
  '44': [
    { code: '4419', name: 'Tableware and kitchenware, of wood' },
    { code: '4420', name: 'Wood marquetry and inlaid wood; ornaments of wood' },
    { code: '4421', name: 'Other articles of wood' },
    { code: '4414', name: 'Wooden frames for paintings, photographs, mirrors or similar objects' },
  ],
  '08': [
    { code: '0804', name: 'Dates, figs, pineapples, avocados, guavas, mangoes and mangosteens, fresh or dried' },
    { code: '0805', name: 'Citrus fruit, fresh or dried' },
    { code: '0806', name: 'Grapes, fresh or dried' },
    { code: '0810', name: 'Other fruit, fresh' },
  ],
  '71': [
    { code: '7113', name: 'Articles of jewellery and parts thereof, of precious metal or of metal clad with precious metal' },
    { code: '7108', name: 'Gold (including gold plated with platinum), unwrought or in semi-manufactured forms, or in powder form' },
    { code: '7102', name: 'Diamonds, whether or not worked, but not mounted or set' },
  ],
  '84': [
    { code: '8471', name: 'Automatic data processing machines and units thereof' },
    { code: '8415', name: 'Air conditioning machines' },
    { code: '8443', name: 'Printing machinery; machines for uses ancillary to printing' },
  ],
};

// Subheadings (6-digit)
export const subheadings: Record<string, HsCodeItem[]> = {
  '2204': [
    { code: '220421', name: 'In containers holding 2 litres or less' },
    { code: '220422', name: 'In containers holding more than 2 litres but not more than 10 litres' },
    { code: '220429', name: 'Other' },
  ],
  '2208': [
    { code: '220830', name: 'Whiskies' },
    { code: '220840', name: 'Rum and other spirits obtained by distilling fermented sugar-cane products' },
    { code: '220870', name: 'Liqueurs and cordials' },
  ],
  '0902': [
    { code: '090210', name: 'Green tea (not fermented) in immediate packings of a content not exceeding 3 kg' },
    { code: '090220', name: 'Other green tea (not fermented)' },
    { code: '090230', name: 'Black tea (fermented) and partly fermented tea, in immediate packings of a content not exceeding 3 kg' },
    { code: '090240', name: 'Other black tea (fermented) and other partly fermented tea' },
  ],
  '4419': [
    { code: '441911', name: 'Bread boards, chopping boards and similar boards' },
    { code: '441912', name: 'Chopsticks' },
    { code: '441919', name: 'Other tableware and kitchenware, of wood' },
  ],
  '7113': [
    { code: '711311', name: 'Of silver, whether or not plated or clad with other precious metal' },
    { code: '711319', name: 'Of other precious metal, whether or not plated or clad with precious metal' },
    { code: '711320', name: 'Of base metal clad with precious metal' },
  ],
  '0804': [
    { code: '080410', name: 'Dates' },
    { code: '080430', name: 'Pineapples' },
    { code: '080440', name: 'Avocados' },
    { code: '080450', name: 'Guavas, mangoes and mangosteens' },
  ],
};

// Sample product data
export const sampleProducts = [
  { 
    id: 1, 
    name: 'Premium Red Wine', 
    description: 'South African Cabernet Sauvignon, 750ml bottle' 
  },
  { 
    id: 2, 
    name: 'Organic Rooibos Tea', 
    description: 'Loose leaf organic rooibos tea, 250g packaging' 
  },
  { 
    id: 3, 
    name: 'Handcrafted Wooden Bowls', 
    description: 'Artisanal wooden bowls made from local timber' 
  },
];
