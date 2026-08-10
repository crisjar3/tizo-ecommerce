import { registerLocaleData } from '@angular/common';
import localeEsAr from '@angular/common/locales/es-AR';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { importProvidersFrom, LOCALE_ID, type ApplicationConfig } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  CircleX,
  ClipboardList,
  Clock3,
  DatabaseBackup,
  FlaskConical,
  History,
  Inbox,
  Info,
  LoaderCircle,
  LockKeyhole,
  LucideAngularModule,
  Menu,
  Minus,
  PackageCheck,
  Package,
  PackageOpen,
  PackageSearch,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Store,
  Trash2,
  Truck,
  TriangleAlert,
  UserRound,
  UserRoundCog,
  Users,
  Wifi,
  WifiOff,
  X,
} from 'lucide-angular';

import { routes } from './app.routes';
import { environment } from '../environments/environment';
import { API_BASE_URL } from './core/api/api-base-url.token';
import { correlationIdInterceptor } from './core/api/correlation-id.interceptor';
import { operatorContextInterceptor } from './core/api/operator-context.interceptor';

registerLocaleData(localeEsAr);

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimations(),
    { provide: LOCALE_ID, useValue: 'es-AR' },
    { provide: API_BASE_URL, useValue: environment.apiBaseUrl },
    provideHttpClient(withInterceptors([correlationIdInterceptor, operatorContextInterceptor])),
    provideRouter(routes),
    importProvidersFrom(
      LucideAngularModule.pick({
        ArrowLeft,
        ArrowRight,
        Check,
        ChevronDown,
        ChevronLeft,
        ChevronRight,
        CircleAlert,
        CircleCheck,
        CircleX,
        ClipboardList,
        Clock3,
        DatabaseBackup,
        FlaskConical,
        History,
        Inbox,
        Info,
        LoaderCircle,
        LockKeyhole,
        Menu,
        Minus,
        PackageCheck,
        Package,
        PackageOpen,
        PackageSearch,
        Plus,
        RefreshCw,
        RotateCcw,
        Search,
        ShieldCheck,
        ShoppingBag,
        ShoppingCart,
        Store,
        Trash2,
        Truck,
        TriangleAlert,
        UserRound,
        UserRoundCog,
        Users,
        Wifi,
        WifiOff,
        X,
      }),
    ),
  ],
};
