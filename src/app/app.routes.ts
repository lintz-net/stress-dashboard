import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'tests',
    pathMatch: 'full'
  },
  {
    path: 'tests',
    loadComponent: () =>
      import('./features/tests/pages/tests-list/tests-list.component').then(m => m.TestsListComponent)
  },
  {
    path: 'test-wizard',
    loadComponent: () =>
      import('./features/tests/pages/test-wizard/test-wizard.component').then(m => m.TestWizardComponent)
  },
  {
    path: 'tests/:testId',
    loadComponent: () =>
      import('./features/tests/pages/tests-detail/tests-detail.component').then(m => m.TestsDetailComponent)
  },
  {
    path: '**',
    redirectTo: 'tests'
  }
];
