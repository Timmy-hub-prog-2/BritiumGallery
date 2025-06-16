import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CategoryAttribute } from '../category';

@Component({
  selector: 'app-attribute-options-modal',
  templateUrl: './attribute-options-modal.component.html',
  styleUrls: ['./attribute-options-modal.component.css'],
  standalone: false
})
export class AttributeOptionsModalComponent implements OnInit {
  @Input() attributes: CategoryAttribute[] = [];
  @Input() isVisible: boolean = false;
  @Output() close = new EventEmitter<void>();
  @Output() saveOptions = new EventEmitter<{attributeId: number, options: string[]}[]>();

  attributeOptions: { [attributeId: number]: string[] } = {};
  newOptions: { [attributeId: number]: string } = {};

  constructor() {}

  ngOnInit(): void {
    // Initialize options for each attribute
    this.attributes.forEach(attr => {
      if (attr.id) {
        this.attributeOptions[attr.id] = attr.options || [];
        this.newOptions[attr.id] = '';
      }
    });
  }

  addOption(attributeId: number): void {
    if (this.newOptions[attributeId]?.trim()) {
      if (!this.attributeOptions[attributeId]) {
        this.attributeOptions[attributeId] = [];
      }
      this.attributeOptions[attributeId].push(this.newOptions[attributeId].trim());
      this.newOptions[attributeId] = '';
    }
  }

  removeOption(attributeId: number, index: number): void {
    this.attributeOptions[attributeId].splice(index, 1);
  }

  onSave(): void {
    const optionsArray = Object.entries(this.attributeOptions).map(([attributeId, options]) => ({
      attributeId: +attributeId,
      options: options
    }));
    this.saveOptions.emit(optionsArray);
    this.close.emit();
  }

  onClose(): void {
    this.close.emit();
  }
} 