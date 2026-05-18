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
		path: 'ingresar',
		loadComponent: () =>
			import('./features/auth/ingresar/ingresar').then((m) => m.IngresarComponent),
	},
	{
		path: 'dashboard/directora',
		canActivate: [directoraGuard],
		canActivateChild: [directoraGuard],
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
				path: 'grados-secciones',
				loadComponent: () => import('./features/dashboard/directora/pages/grados-secciones/grados-secciones').then(m => m.GradosSeccionesPage)
			},
			{
				path: 'aulas',
				loadComponent: () => import('./features/dashboard/directora/pages/aulas/aulas').then(m => m.AulasPage)
			},
			{
				path: 'cursos',
				loadComponent: () => import('./features/dashboard/directora/pages/cursos/cursos').then(m => m.CursosPage)
			},
			{
				path: 'carga-academica',
				loadComponent: () => import('./features/dashboard/directora/pages/estructura/estructura').then(m => m.Estructura)
			},
			{
				path: 'tutoria',
				loadComponent: () => import('./features/dashboard/directora/pages/tutoria/tutoria').then(m => m.TutoriaPage)
			},
			{
				path: 'auxiliares',
				loadComponent: () => import('./features/dashboard/directora/pages/auxiliares/auxiliares').then(m => m.AuxiliaresPage)
			},
			{
				path: 'matricula',
				loadComponent: () => import('./features/dashboard/directora/pages/matricula/matricula').then(m => m.Matricula)
			},
			{
				path: 'usuarios',
				loadComponent: () => import('./features/dashboard/directora/pages/usuarios/usuarios').then(m => m.Usuarios)
			},
			{
				path: 'comunicados',
				loadComponent: () => import('./features/dashboard/directora/pages/comunicados/comunicados').then(m => m.Comunicados)
			},
			{
				path: 'perfil',
				loadComponent: () => import('./features/dashboard/directora/pages/perfil/perfil').then(m => m.Perfil)
			},
			{
				path: 'desbloqueo-notas',
				loadComponent: () => import('./features/dashboard/directora/pages/desbloqueo-notas/desbloqueo-notas').then(m => m.DesbloqueoNotas)
			},
			{
				path: 'configuracion-anio',
				loadComponent: () => import('./features/dashboard/directora/pages/configuracion-anio/configuracion-anio').then(m => m.ConfiguracionAnioComponent)
			}
		]
	},
	{
		path: 'dashboard/docente',
		canActivate: [docenteGuard],
		canActivateChild: [docenteGuard],
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
				path: 'incidencias',
				loadComponent: () =>
					import('./features/dashboard/docente/pages/incidencias/incidencias').then(
						(m) => m.IncidenciasDocenteComponent
					),
				data: { title: 'Registro de Incidencias', description: 'Registro de incidencias disciplinarias y académicas.' },
			},
			{
				path: 'reportes',
				loadComponent: () =>
					import('./features/dashboard/docente/pages/reportes/reportes-docente').then(
						(m) => m.ReportesDocenteComponent
					),
				data: { title: 'Reportes y Métricas', description: 'Monitoreo de competencias y detección de estudiantes para refuerzo.' },
			},
			{
				path: 'tutoria',
				loadComponent: () =>
					import('./features/dashboard/docente/pages/tutoria-docente/tutoria-docente').then(
						(m) => m.TutoriaDocenteComponent
					),
				data: { title: 'Tutoría Asignada', description: 'Monitoreo conductual, incidencias, rendimiento por cursos y notas bimestrales del aula.' },
			},
			{
				path: 'avisos',
				loadComponent: () =>
					import('./features/dashboard/docente/pages/placeholder/placeholder').then(
						(m) => m.PlaceholderDocenteComponent
					),
				data: { title: 'Mis Avisos', description: 'Próximamente: avisos y comunicaciones.' },
			},
			{
				path: 'perfil',
				loadComponent: () =>
					import('./features/dashboard/directora/pages/perfil/perfil').then(
						(m) => m.Perfil
					),
				data: { title: 'Configuración de Perfil', description: 'Actualización de datos de contacto y cambio de credenciales de acceso.' },
			},
		],
	},
	{
		path: 'dashboard/padre',
		canActivate: [padresGuard],
		canActivateChild: [padresGuard],
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
				path: 'asistencia-diaria',
				loadComponent: () => import('./features/padres/pages/dashboard/asistencia-diaria/asistencia-diaria').then(m => m.AsistenciaDiariaComponent)
			},
			{
				path: 'asistencia',
				loadComponent: () => import('./features/padres/pages/dashboard/asistencia-padre').then(m => m.AsistenciaPadresComponent)
			},
			{
				path: 'incidencias',
				loadComponent: () => import('./features/padres/pages/dashboard/incidencias/incidencias-padre').then(m => m.IncidenciasPadresComponent)
			},
			{
				path: 'notas',
				loadComponent: () => import('./features/padres/pages/dashboard/notas-padre').then(m => m.NotasPadresComponent)
			},
			{
				path: 'horario',
				loadComponent: () => import('./features/padres/pages/dashboard/horario/horario-padre').then(m => m.HorarioPadresComponent)
			},
			{
				path: 'perfil',
				loadComponent: () =>
					import('./features/dashboard/directora/pages/perfil/perfil').then(
						(m) => m.Perfil
					),
				data: { title: 'Configuración de Perfil', description: 'Actualización de datos de contacto y cambio de credenciales de acceso.' },
			}
		]
	},
	{
		path: 'dashboard/auxiliar',
		canActivate: [auxiliarGuard],
		canActivateChild: [auxiliarGuard],
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
				path: 'incidencias',
				loadComponent: () =>
					import('./features/auxiliar/pages/incidencias-auxiliar/incidencias-auxiliar').then(
						(m) => m.IncidenciasAuxiliarComponent
					),
			},
			{
				path: 'asistencia/:aulaId/:cargaId',
				loadComponent: () =>
					import(
						'./features/auxiliar/pages/registro-asistencia-auxiliar'
					).then((m) => m.RegistroAsistenciaAuxiliarComponent),
			},
			{
				path: 'perfil',
				loadComponent: () =>
					import('./features/dashboard/directora/pages/perfil/perfil').then(
						(m) => m.Perfil
					),
				data: { title: 'Configuración de Perfil', description: 'Actualización de datos de contacto y cambio de credenciales de acceso.' },
			},
		],
	},
	{
		path: '**',
		redirectTo: 'login',
	},
];

