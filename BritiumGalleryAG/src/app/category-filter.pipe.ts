import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'categoryFilter'
})
export class CategoryFilterPipe implements PipeTransform {
  transform(categories: any[], searchTerm: string): any[] {
    if (!categories) return [];
    if (!searchTerm) return categories;
    const lower = searchTerm.toLowerCase();
    return categories.filter(cat =>
      cat.name && cat.name.toLowerCase().includes(lower)
    );
  }
} 