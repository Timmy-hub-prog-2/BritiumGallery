import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'productFilter'
})
export class ProductFilterPipe implements PipeTransform {
  transform(products: any[], searchTerm: string): any[] {
    if (!products) return [];
    if (!searchTerm) return products;
    const lower = searchTerm.toLowerCase();
    return products.filter(prod =>
      prod.name && prod.name.toLowerCase().includes(lower)
    );
  }
} 