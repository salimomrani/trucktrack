import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { AppComponent } from './app.component';
import { authReducer } from './store/auth/auth.reducer';
import { trucksReducer } from './store/trucks/trucks.reducer';
import { gpsReducer } from './store/gps/gps.reducer';
import { historyReducer } from './store/history/history.reducer';
import { cacheReducer } from './store/cache';
import { notificationsReducer } from './store/notifications/notifications.reducer';
import { languageReducer } from './store/language/language.reducer';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideStore({
          auth: authReducer,
          trucks: trucksReducer,
          gps: gpsReducer,
          history: historyReducer,
          cache: cacheReducer,
          notifications: notificationsReducer,
          language: languageReducer
        }),
        provideEffects([])
      ]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });


  it('should render router outlet', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('router-outlet')).toBeTruthy();
  });
});
