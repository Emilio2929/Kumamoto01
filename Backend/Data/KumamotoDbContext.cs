using Microsoft.EntityFrameworkCore;
using Kumamoto.API.Models;

namespace Kumamoto.API.Data;

public class KumamotoDbContext : DbContext
{
    public KumamotoDbContext(DbContextOptions<KumamotoDbContext> options) : base(options) { }

    public DbSet<Rol> Roles { get; set; }
    public DbSet<Grado> Grados { get; set; }
    public DbSet<Seccion> Secciones { get; set; }
    public DbSet<Aula> Aulas { get; set; }
    public DbSet<Usuario> Usuarios { get; set; }
    public DbSet<Estudiante> Estudiantes { get; set; }
    public DbSet<Asistencia> Asistencias { get; set; }
    public DbSet<AsignacionAuxiliar> AsignacionesAuxiliar { get; set; }
    public DbSet<Incidencia> Incidencias { get; set; }
    public DbSet<AlertaRiesgo> AlertasRiesgo { get; set; }
    public DbSet<Curso> Cursos { get; set; }
    public DbSet<CargaAcademica> CargasAcademicas { get; set; }
    public DbSet<HorarioCurso> HorarioDetalle { get; set; }
    public DbSet<PeriodoAcademico> PeriodosAcademicos { get; set; }
    public DbSet<Competencia> Competencias { get; set; }
    public DbSet<Calificacion> Calificaciones { get; set; }
    public DbSet<EscalaCalificacion> EscalaCalificaciones { get; set; } = null!;
    public DbSet<SemanaAcademica> SemanaAcademicas { get; set; } = null!;
    public DbSet<CalificacionBimestral> CalificacionesBimestrales { get; set; } = null!;
    public DbSet<AlumnoRiesgo> AlumnosRiesgo { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Mapeo explícito de tablas (snake_case, singular, igual que el script SQL)
        modelBuilder.Entity<Rol>().ToTable("rol");
        modelBuilder.Entity<Grado>().ToTable("grado");
        modelBuilder.Entity<Seccion>().ToTable("seccion");
        modelBuilder.Entity<Aula>().ToTable("aula");
        modelBuilder.Entity<Usuario>().ToTable("usuario");
        modelBuilder.Entity<Estudiante>().ToTable("estudiante");
        modelBuilder.Entity<Asistencia>().ToTable("asistencia");
        modelBuilder.Entity<AsignacionAuxiliar>().ToTable("asignacion_auxiliar");
        modelBuilder.Entity<Incidencia>().ToTable("incidencia");
        modelBuilder.Entity<AlertaRiesgo>().ToTable("alerta_riesgo");
        modelBuilder.Entity<Curso>().ToTable("curso");
        modelBuilder.Entity<CargaAcademica>().ToTable("carga_academica");
        modelBuilder.Entity<HorarioCurso>().ToTable("horario_detalle");
        modelBuilder.Entity<PeriodoAcademico>().ToTable("periodo_academico");
        modelBuilder.Entity<Competencia>().ToTable("competencia");
        modelBuilder.Entity<Calificacion>().ToTable("calificacion");
        modelBuilder.Entity<EscalaCalificacion>().ToTable("escala_calificacion");
        modelBuilder.Entity<SemanaAcademica>().ToTable("semana_academica");
        modelBuilder.Entity<CalificacionBimestral>().ToTable("calificacion_bimestral");
        modelBuilder.Entity<AlumnoRiesgo>().ToTable("alumno_riesgo");

        // Relaciones de Calificacion (5NF)
        modelBuilder.Entity<Calificacion>()
            .HasOne(c => c.Semana)
            .WithMany()
            .HasForeignKey(c => c.SemanaId)
            .IsRequired();

        modelBuilder.Entity<Calificacion>()
            .HasOne(c => c.Escala)
            .WithMany()
            .HasForeignKey(c => c.EscalaId)
            .IsRequired();

        modelBuilder.Entity<Calificacion>()
            .HasOne(c => c.Competencia)
            .WithMany()
            .HasForeignKey(c => c.CompetenciaId)
            .IsRequired(false);

        modelBuilder.Entity<Calificacion>()
            .HasOne(c => c.Estudiante)
            .WithMany()
            .HasForeignKey(c => c.EstudianteId)
            .IsRequired(false);

        // Unicidad de calificación semanal
        modelBuilder.Entity<Calificacion>()
            .HasIndex(c => new { c.EstudianteId, c.CompetenciaId, c.SemanaId })
            .IsUnique()
            .HasDatabaseName("uc_calificacion_semana");

        // SemanaAcademica → PeriodoAcademico
        modelBuilder.Entity<SemanaAcademica>()
            .HasOne(s => s.Periodo)
            .WithMany()
            .HasForeignKey(s => s.PeriodoId);

        // Unique constraint grado + sección en Aula
        modelBuilder.Entity<Aula>()
            .HasIndex(a => new { a.GradoId, a.SeccionId })
            .IsUnique()
            .HasDatabaseName("uc_grado_seccion");

        // Unique en DNI y Correo de usuario
        modelBuilder.Entity<Usuario>()
            .HasIndex(u => u.Dni).IsUnique();
        modelBuilder.Entity<Usuario>()
            .HasIndex(u => u.Correo).IsUnique();

        // CargaAcademica → Aula, Curso, Docente (nullable)
        modelBuilder.Entity<CargaAcademica>()
            .HasOne(ca => ca.Aula)
            .WithMany()
            .HasForeignKey(ca => ca.AulaId);

        modelBuilder.Entity<CargaAcademica>()
            .HasOne(ca => ca.Curso)
            .WithMany()
            .HasForeignKey(ca => ca.CursoId);

        modelBuilder.Entity<CargaAcademica>()
            .HasOne(ca => ca.Docente)
            .WithMany()
            .HasForeignKey(ca => ca.DocenteId)
            .IsRequired(false);

        // HorarioCurso → CargaAcademica (cascade delete)
        modelBuilder.Entity<HorarioCurso>()
            .HasOne(h => h.Carga)
            .WithMany(ca => ca.Horarios)
            .HasForeignKey(h => h.CargaId)
            .OnDelete(DeleteBehavior.Cascade);

        // AsignacionAuxiliar → Auxiliar(Usuario), Aula
        modelBuilder.Entity<AsignacionAuxiliar>()
            .HasOne(a => a.Auxiliar)
            .WithMany()
            .HasForeignKey(a => a.AuxiliarId);

        modelBuilder.Entity<AsignacionAuxiliar>()
            .HasOne(a => a.Aula)
            .WithMany()
            .HasForeignKey(a => a.AulaId);

        // Asistencia → Estudiante, RegistradoPor, AsignacionAuxiliar (nullable), CargaAcademica (nullable)
        modelBuilder.Entity<Asistencia>()
            .HasOne(a => a.Estudiante)
            .WithMany()
            .HasForeignKey(a => a.EstudianteId);

        modelBuilder.Entity<Asistencia>()
            .HasOne(a => a.RegistradoPor)
            .WithMany()
            .HasForeignKey(a => a.RegistradoPorId);

        modelBuilder.Entity<Asistencia>()
            .HasOne(a => a.AsignacionAuxiliar)
            .WithMany()
            .HasForeignKey(a => a.AsignacionAuxiliarId)
            .IsRequired(false);

        modelBuilder.Entity<Asistencia>()
            .HasOne(a => a.CargaAcademica)
            .WithMany()
            .HasForeignKey(a => a.CargaAcademicaId)
            .IsRequired(false);

        // Incidencia → Estudiante, RegistradoPor
        modelBuilder.Entity<Incidencia>()
            .HasOne(i => i.Estudiante)
            .WithMany()
            .HasForeignKey(i => i.EstudianteId);

        modelBuilder.Entity<Incidencia>()
            .HasOne(i => i.RegistradoPor)
            .WithMany()
            .HasForeignKey(i => i.RegistradoPorId);
    }
}
