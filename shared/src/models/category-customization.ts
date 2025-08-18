export interface CategoryColor {
  id: string;
  name: string;
  value: string;
  textColor: string; // For contrast
}

export interface CategoryIcon {
  id: string;
  name: string;
  materialIcon: string;
}

export const CATEGORY_COLORS: CategoryColor[] = [
  // Red spectrum - pastel to vibrant
  { id: 'pastel-pink', name: 'Pastel Pink', value: '#FFB3BA', textColor: '#000000' },
  { id: 'coral', name: 'Coral', value: '#FF6B6B', textColor: '#ffffff' },
  { id: 'red', name: 'Red', value: '#F44336', textColor: '#ffffff' },
  { id: 'crimson', name: 'Crimson', value: '#DC143C', textColor: '#ffffff' },
  
  // Orange spectrum
  { id: 'pastel-peach', name: 'Pastel Peach', value: '#FFDFBA', textColor: '#000000' },
  { id: 'peach', name: 'Peach', value: '#FBBF24', textColor: '#000000' },
  { id: 'orange', name: 'Orange', value: '#FF9800', textColor: '#ffffff' },
  
  // Yellow spectrum
  { id: 'pastel-yellow', name: 'Pastel Yellow', value: '#FFFFBA', textColor: '#000000' },
  { id: 'amber', name: 'Amber', value: '#FFC107', textColor: '#000000' },
  { id: 'yellow', name: 'Yellow', value: '#FFEB3B', textColor: '#000000' },
  
  // Green spectrum
  { id: 'pastel-green', name: 'Pastel Green', value: '#BAFFC9', textColor: '#000000' },
  { id: 'mint', name: 'Mint', value: '#06D6A0', textColor: '#ffffff' },
  { id: 'green', name: 'Green', value: '#4CAF50', textColor: '#ffffff' },
  { id: 'forest', name: 'Forest', value: '#22C55E', textColor: '#ffffff' },
  { id: 'teal', name: 'Teal', value: '#009688', textColor: '#ffffff' },
  
  // Blue spectrum
  { id: 'pastel-blue', name: 'Pastel Blue', value: '#BAE1FF', textColor: '#000000' },
  { id: 'sky', name: 'Sky', value: '#0EA5E9', textColor: '#ffffff' },
  { id: 'blue', name: 'Blue', value: '#2196F3', textColor: '#ffffff' },
  { id: 'cyan', name: 'Cyan', value: '#00BCD4', textColor: '#ffffff' },
  { id: 'turquoise', name: 'Turquoise', value: '#14B8A6', textColor: '#ffffff' },
  
  // Indigo/Purple spectrum
  { id: 'pastel-purple', name: 'Pastel Purple', value: '#D4BAFF', textColor: '#000000' },
  { id: 'lavender', name: 'Lavender', value: '#A78BFA', textColor: '#ffffff' },
  { id: 'violet', name: 'Violet', value: '#8B5CF6', textColor: '#ffffff' },
  { id: 'purple', name: 'Purple', value: '#9C27B0', textColor: '#ffffff' },
  { id: 'indigo', name: 'Indigo', value: '#3F51B5', textColor: '#ffffff' },
  
  // Neutrals
  { id: 'pastel-grey', name: 'Pastel Grey', value: '#E5E5E5', textColor: '#000000' },
  { id: 'slate', name: 'Slate', value: '#64748B', textColor: '#ffffff' },
  { id: 'brown', name: 'Brown', value: '#795548', textColor: '#ffffff' }
];

export const CATEGORY_ICONS: CategoryIcon[] = [
  { id: 'home', name: 'Home', materialIcon: 'home' },
  { id: 'restaurant', name: 'Food', materialIcon: 'restaurant' },
  { id: 'directions_car', name: 'Transportation', materialIcon: 'directions_car' },
  { id: 'shopping_cart', name: 'Shopping', materialIcon: 'shopping_cart' },
  { id: 'local_hospital', name: 'Healthcare', materialIcon: 'local_hospital' },
  { id: 'school', name: 'Education', materialIcon: 'school' },
  { id: 'movie', name: 'Entertainment', materialIcon: 'movie' },
  { id: 'fitness_center', name: 'Fitness', materialIcon: 'fitness_center' },
  { id: 'pets', name: 'Pets', materialIcon: 'pets' },
  { id: 'child_care', name: 'Childcare', materialIcon: 'child_care' },
  { id: 'phone', name: 'Phone', materialIcon: 'phone' },
  { id: 'wifi', name: 'Internet', materialIcon: 'wifi' },
  { id: 'electric_bolt', name: 'Utilities', materialIcon: 'electric_bolt' },
  { id: 'savings', name: 'Savings', materialIcon: 'savings' },
  { id: 'account_balance', name: 'Banking', materialIcon: 'account_balance' },
  { id: 'credit_card', name: 'Credit Card', materialIcon: 'credit_card' },
  { id: 'work', name: 'Work', materialIcon: 'work' },
  { id: 'flight', name: 'Travel', materialIcon: 'flight' },
  { id: 'local_gas_station', name: 'Gas', materialIcon: 'local_gas_station' },
  { id: 'local_grocery_store', name: 'Groceries', materialIcon: 'local_grocery_store' },
  { id: 'spa', name: 'Personal Care', materialIcon: 'spa' },
  { id: 'sports_esports', name: 'Gaming', materialIcon: 'sports_esports' },
  { id: 'library_books', name: 'Books', materialIcon: 'library_books' },
  { id: 'music_note', name: 'Music', materialIcon: 'music_note' },
  { id: 'camera_alt', name: 'Photography', materialIcon: 'camera_alt' },
  { id: 'build', name: 'Tools', materialIcon: 'build' },
  { id: 'park', name: 'Recreation', materialIcon: 'park' },
  { id: 'restaurant_menu', name: 'Dining Out', materialIcon: 'restaurant_menu' },
  { id: 'local_cafe', name: 'Coffee', materialIcon: 'local_cafe' },
  { id: 'shopping_bag', name: 'Clothing', materialIcon: 'shopping_bag' }
];

export const DEFAULT_CATEGORY_COLOR = 'blue';
export const DEFAULT_CATEGORY_ICON = 'home';