import type { Routes } from '@angular/router';
import { Shell } from './core/layout/shell';

export const routes: Routes = [{ path: '', component: Shell, children: [] }];
