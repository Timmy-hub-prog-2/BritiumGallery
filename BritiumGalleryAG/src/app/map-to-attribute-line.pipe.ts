import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'mapToAttributeLine',
  standalone: true
})
export class MapToAttributeLinePipe implements PipeTransform {
  transform(value: {key: string, value: string}[]): string {
    if (!value || !Array.isArray(value)) return '';
    return value.map(attr => `${attr.key}: ${attr.value}`).join(', ');
  }
} 