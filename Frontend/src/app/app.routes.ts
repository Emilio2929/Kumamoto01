import { Routes } from '@angular/router';

export const routes: Routes = [
	{
		path: '',
		redirectTo: 'login',
		pathMatch: 'full',
	},
	{
		path: 'login',
		loadComponent: () =>
			import('./features/auth/login/login').then((m) => m.LoginComponent),
	},
	{
		path: 'dashboard/directora',
		loadComponent: () =>
			import('./features/dashboard/directora/directora').then((m) => m.Directora),
		children: [
			{
				path: '',
				redirectTo: 'resumen',
				pathMatch: 'full'
			},
			{
				path: 'resumen',
				loadComponent: () => import('./features/dashboard/directora/pages/resumen/resumen').then(m => m.Resumen)
			},
			{
				path: 'estructura',
				loadComponent: () => import('./features/dashboard/directora/pages/estructura/estructura').then(m => m.Estructura)
			},
			{
				path: 'padres',
				loadComponent: () => import('./features/dashboard/directora/pages/padres/padres').then(m => m.Padres)
			},
			{
				path: 'matricula',
				loadComponent: () => import('./features/dashboard/directora/pages/matricula/matricula').then(m => m.Matricula)
			},
			{
				path: 'personal',
				loadComponent: () => import('./features/dashboard/directora/pages/personal/personal').then(m => m.Personal)
			},
			{
				path: 'incidencias',
				loadComponent: () => import('./features/dashboard/directora/pages/incidencias/incidencias').then(m => m.Incidencias)
			},
			{
				path: 'perfil',
				loadComponent: () => import('./features/dashboard/directora/pages/perfil/perfil').then(m => m.Perfil)
			}
		]
	},
	{
		path: 'dashboard/docente',
		loadComponent: () => import('./features/dashboard/docente/docente').then((m) => m.Docente),
	},
	{
		path: 'dashboard/padre',
		loadComponent: () => import('./features/dashboard/padre/padre').then((m) => m.Padre),
	},
	{
		path: '**',
		redirectTo: 'login',
	},
];
