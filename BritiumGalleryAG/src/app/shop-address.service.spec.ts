import { TestBed } from '@angular/core/testing';

import { ShopAddressService } from './shop-address.service';

describe('ShopAddressService', () => {
  let service: ShopAddressService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ShopAddressService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
