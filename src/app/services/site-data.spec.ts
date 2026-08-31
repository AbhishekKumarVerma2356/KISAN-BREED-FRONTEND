import { TestBed } from '@angular/core/testing';

import { SiteData } from './site-data';

describe('SiteData', () => {
  let service: SiteData;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SiteData);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
