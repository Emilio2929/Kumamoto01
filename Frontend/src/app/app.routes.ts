import { Routes } from '@angular/router';
import { directoraGuard, docenteGuard, auxiliarGuard } from './core/guards/auth.guard';
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
		canActivate: [directoraGuard],
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
				path: 'comunicados',
				loadComponent: () => import('./features/dashboard/directora/pages/comunicados/comunicados').then(m => m.Comunicados)
			},
			{
				path: 'perfil',
				loadComponent: () => import('./features/dashboard/directora/pages/perfil/perfil').then(m => m.Perfil)
			}

		]
	},
	{
		path: 'dashboard/docente',
		canActivate: [docenteGuard],
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
					import('./features/dashboard/docente/pages/calificaciones/calificaciones.component').then(
						(m) => m.CalificacionesComponent
					),
				data: { title: 'Calificaciones', description: 'Módulo de gestión de competencias y notas.' },
			},
			{
				path: 'calificaciones/:cargaId',
				loadComponent: () =>
					import('./features/dashboard/docente/pages/calificaciones/calificaciones.component').then(
						(m) => m.CalificacionesComponent
					),
				data: { title: 'Calificaciones', description: 'Módulo de gestión de competencias y notas.' },
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
		canActivate: [auxiliarGuard],
		loadComponent: () =>
			import('./features/auxiliar').then((m) => m.AuxiliarLayoutComponent),
		children: [
			{
				path: '',
				redirectTo: 'dashboard',
				pathMatch: 'full',
			},
			{
				path: 'dashboard',
				loadComponent: () =>
					import('./features/auxiliar/pages/dashboard-auxiliar/dashboard-auxiliar').then(
						(m) => m.DashboardAuxiliarComponent
					),
			},
			{
				path: 'aulas',
				loadComponent: () =>
					import('./features/auxiliar/pages/lista-aulas-auxiliar').then(
						(m) => m.ListaAulasAuxiliarComponent
					),
			},
			{
				path: 'reportes',
				loadComponent: () =>
					import('./features/auxiliar/pages/reportes-auxiliar/reportes-auxiliar').then(
						(m) => m.ReportesAuxiliarComponent
					),
			},
			{
				path: 'asistencia/:aulaId/:cargaId',
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

