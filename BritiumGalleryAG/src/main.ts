(window as any).global = window;
import { platformBrowser } from '@angular/platform-browser';
import { AppModule } from './app/app.module';
import './polyfills';

platformBrowser().bootstrapModule(AppModule, {
  ngZoneEventCoalescing: true,
})
  .catch(err => console.error(err));
