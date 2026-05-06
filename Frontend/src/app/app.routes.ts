import { Routes } from '@angular/router';
import { padresGuard } from './core/guards/padres.guard';

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
		loadComponent: () =>
			import('./features/dashboard/docente/docente').then((m) => m.Docente),
		children: [
			{
				path: '',
				redirectTo: 'resumen',
				pathMatch: 'full',
			},
			{
				path: 'resumen',
				loadComponent: () =>
					import('./features/dashboard/docente/pages/dashboard-docente/dashboard-docente').then(
						(m) => m.DashboardDocenteComponent
					),
			},
			{
				path: 'mis-cursos',
				loadComponent: () =>
					import('./features/dashboard/docente/pages/lista-cursos/lista-cursos').then(
						(m) => m.ListaCursosComponent
					),
			},
			{
				path: 'asistencia',
				loadComponent: () =>
					import('./features/dashboard/docente/pages/asistencia/asistencia').then(
						(m) => m.AsistenciaDocenteComponent
					),
				data: { title: 'Registro de Asistencia', description: 'Toma de asistencia en tiempo real para la clase actual.' },
			},
			{
				path: 'calificaciones',
				loadComponent: () =>
					import('./features/dashboard/docente/pages/placeholder/placeholder').then(
						(m) => m.PlaceholderDocenteComponent
					),
				data: { title: 'Calificaciones', description: 'Próximamente: grilla dinámica por competencias.' },
			},
			{
				path: 'avisos',
				loadComponent: () =>
					import('./features/dashboard/docente/pages/placeholder/placeholder').then(
						(m) => m.PlaceholderDocenteComponent
					),
				data: { title: 'Mis Avisos', description: 'Próximamente: avisos y comunicaciones.' },
			},
		],
	},
	{
		path: 'dashboard/padre',
		canActivate: [padresGuard],
		loadComponent: () => import('./features/padres/layout/padre-layout').then((m) => m.PadreLayoutComponent),
		children: [
			{
				path: '',
				redirectTo: 'dashboard',
				pathMatch: 'full'
			},
			{
				path: 'dashboard',
				loadComponent: () => import('./features/padres/pages/dashboard/dashboard-padre').then(m => m.DashboardPadresComponent)
			},
			{
				path: 'notas',
				loadComponent: () => import('./features/padres/pages/dashboard/notas-padre').then(m => m.NotasPadresComponent)
			},
			{
				path: 'asistencia',
				loadComponent: () => import('./features/padres/pages/dashboard/asistencia-padre').then(m => m.AsistenciaPadresComponent)
			}
		]
	},
	{
		path: 'dashboard/auxiliar',
		loadComponent: () =>
			import('./features/auxiliar').then((m) => m.AuxiliarLayoutComponent),
		children: [
			{
				path: '',
				redirectTo: 'aulas',
				pathMatch: 'full',
			},
			{
				path: 'aulas',
				loadComponent: () =>
					import('./features/auxiliar/pages/lista-aulas-auxiliar').then(
						(m) => m.ListaAulasAuxiliarComponent
					),
			},
			{
				path: 'asistencia/:aulaId',
				loadComponent: () =>
					import(
						'./features/auxiliar/pages/registro-asistencia-auxiliar'
					).then((m) => m.RegistroAsistenciaAuxiliarComponent),
			},
		],
	},
	{
		path: '**',
		redirectTo: 'login',
	},
];
