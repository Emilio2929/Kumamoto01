--
-- PostgreSQL database dump
--

\restrict UGh3Tq2axZjBp0MTEDDLUheYynHiVmHnskDnqhGeXFWldZyHNluLofnNgtJsz8E

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

-- Started on 2026-05-11 21:32:30

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 4 (class 2615 OID 2200)
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- TOC entry 5311 (class 0 OID 0)
-- Dependencies: 4
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 250 (class 1259 OID 17010)
-- Name: alerta_riesgo; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.alerta_riesgo (
    id integer NOT NULL,
    estudiante_id integer,
    nivel_riesgo character varying(20),
    motivo text,
    fecha_calculo timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    estado smallint DEFAULT 1,
    CONSTRAINT alerta_riesgo_estado_check CHECK ((estado = ANY (ARRAY[0, 1])))
);


--
-- TOC entry 249 (class 1259 OID 17009)
-- Name: alerta_riesgo_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.alerta_riesgo_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5312 (class 0 OID 0)
-- Dependencies: 249
-- Name: alerta_riesgo_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.alerta_riesgo_id_seq OWNED BY public.alerta_riesgo.id;


--
-- TOC entry 258 (class 1259 OID 17147)
-- Name: alumno_riesgo; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.comunicado (
    id integer NOT NULL,
    titulo character varying(200) NOT NULL,
    contenido text NOT NULL,
    url_imagen character varying(500),
    url_archivo character varying(500),
    fecha_publicacion timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    fecha_expiracion timestamp with time zone,
    es_importante boolean DEFAULT false,
    estado smallint DEFAULT 1,
    usuario_id integer
);

CREATE SEQUENCE public.comunicado_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.comunicado_id_seq OWNED BY public.comunicado.id;
ALTER TABLE ONLY public.comunicado ALTER COLUMN id SET DEFAULT nextval('public.comunicado_id_seq'::regclass);
ALTER TABLE ONLY public.comunicado ADD CONSTRAINT comunicado_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.comunicado ADD CONSTRAINT comunicado_usuario_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuario(id);



CREATE TABLE public.alumno_riesgo (

    id integer NOT NULL,
    estudiante_id integer NOT NULL,
    nivel_riesgo character varying(20) DEFAULT 'Bajo'::character varying NOT NULL,
    motivo text,
    recomendacion text,
    fecha_calculo timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    bimestre integer,
    estado smallint DEFAULT 1
);


--
-- TOC entry 257 (class 1259 OID 17146)
-- Name: alumno_riesgo_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.alumno_riesgo_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5313 (class 0 OID 0)
-- Dependencies: 257
-- Name: alumno_riesgo_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.alumno_riesgo_id_seq OWNED BY public.alumno_riesgo.id;


--
-- TOC entry 238 (class 1259 OID 16859)
-- Name: asignacion_auxiliar; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.asignacion_auxiliar (
    id integer NOT NULL,
    auxiliar_id integer,
    aula_id integer,
    periodo_lectivo character varying(10),
    estado smallint DEFAULT 1,
    CONSTRAINT asignacion_auxiliar_estado_check CHECK ((estado = ANY (ARRAY[0, 1])))
);


--
-- TOC entry 237 (class 1259 OID 16858)
-- Name: asignacion_auxiliar_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.asignacion_auxiliar_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5314 (class 0 OID 0)
-- Dependencies: 237
-- Name: asignacion_auxiliar_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.asignacion_auxiliar_id_seq OWNED BY public.asignacion_auxiliar.id;


--
-- TOC entry 246 (class 1259 OID 16955)
-- Name: asistencia; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.asistencia (
    id integer NOT NULL,
    estudiante_id integer,
    registrado_por_id integer,
    carga_academica_id integer,
    asignacion_auxiliar_id integer,
    fecha date DEFAULT CURRENT_DATE,
    valor character(1),
    estado smallint DEFAULT 1,
    CONSTRAINT asistencia_estado_check CHECK ((estado = ANY (ARRAY[0, 1]))),
    CONSTRAINT asistencia_valor_check CHECK ((valor = ANY (ARRAY['P'::bpchar, 'F'::bpchar, 'T'::bpchar, 'J'::bpchar])))
);


--
-- TOC entry 245 (class 1259 OID 16954)
-- Name: asistencia_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.asistencia_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5315 (class 0 OID 0)
-- Dependencies: 245
-- Name: asistencia_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.asistencia_id_seq OWNED BY public.asistencia.id;


--
-- TOC entry 234 (class 1259 OID 16811)
-- Name: aula; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.aula (
    id integer NOT NULL,
    descripcion character varying(100),
    capacidad integer NOT NULL,
    grado_id integer,
    seccion_id integer,
    tutor_id integer,
    estado smallint DEFAULT 1,
    CONSTRAINT aula_estado_check CHECK ((estado = ANY (ARRAY[0, 1])))
);


--
-- TOC entry 233 (class 1259 OID 16810)
-- Name: aula_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.aula_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5316 (class 0 OID 0)
-- Dependencies: 233
-- Name: aula_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.aula_id_seq OWNED BY public.aula.id;


--
-- TOC entry 244 (class 1259 OID 16922)
-- Name: calificacion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.calificacion (
    id integer NOT NULL,
    estudiante_id integer,
    competencia_id integer,
    fecha_registro timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    estado smallint DEFAULT 1,
    semana_id integer,
    escala_id integer,
    CONSTRAINT calificacion_estado_check CHECK ((estado = ANY (ARRAY[0, 1])))
);


--
-- TOC entry 256 (class 1259 OID 17095)
-- Name: calificacion_bimestral; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.calificacion_bimestral (
    id integer NOT NULL,
    estudiante_id integer,
    competencia_id integer,
    periodo_id integer,
    escala_id integer,
    fecha_registro timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    estado smallint DEFAULT 1,
    CONSTRAINT calificacion_bimestral_estado_check CHECK ((estado = ANY (ARRAY[0, 1])))
);


--
-- TOC entry 255 (class 1259 OID 17094)
-- Name: calificacion_bimestral_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.calificacion_bimestral_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5317 (class 0 OID 0)
-- Dependencies: 255
-- Name: calificacion_bimestral_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.calificacion_bimestral_id_seq OWNED BY public.calificacion_bimestral.id;


--
-- TOC entry 243 (class 1259 OID 16921)
-- Name: calificacion_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.calificacion_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5318 (class 0 OID 0)
-- Dependencies: 243
-- Name: calificacion_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.calificacion_id_seq OWNED BY public.calificacion.id;


--
-- TOC entry 240 (class 1259 OID 16879)
-- Name: carga_academica; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.carga_academica (
    id integer NOT NULL,
    docente_id integer,
    curso_id integer,
    aula_id integer,
    periodo_lectivo character varying(10),
    estado smallint DEFAULT 1,
    CONSTRAINT carga_academica_estado_check CHECK ((estado = ANY (ARRAY[0, 1])))
);


--
-- TOC entry 239 (class 1259 OID 16878)
-- Name: carga_academica_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.carga_academica_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5319 (class 0 OID 0)
-- Dependencies: 239
-- Name: carga_academica_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.carga_academica_id_seq OWNED BY public.carga_academica.id;


--
-- TOC entry 228 (class 1259 OID 16753)
-- Name: competencia; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.competencia (
    id integer NOT NULL,
    curso_id integer,
    nombre character varying(255) NOT NULL,
    numero_orden integer NOT NULL,
    estado smallint DEFAULT 1,
    carga_id integer,
    peso numeric(5,2) DEFAULT 1.0,
    codigo text DEFAULT ''::text,
    CONSTRAINT competencia_estado_check CHECK ((estado = ANY (ARRAY[0, 1])))
);


--
-- TOC entry 227 (class 1259 OID 16752)
-- Name: competencia_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.competencia_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5320 (class 0 OID 0)
-- Dependencies: 227
-- Name: competencia_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.competencia_id_seq OWNED BY public.competencia.id;


--
-- TOC entry 226 (class 1259 OID 16742)
-- Name: curso; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.curso (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    estado smallint DEFAULT 1,
    CONSTRAINT curso_estado_check CHECK ((estado = ANY (ARRAY[0, 1])))
);


--
-- TOC entry 225 (class 1259 OID 16741)
-- Name: curso_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.curso_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5321 (class 0 OID 0)
-- Dependencies: 225
-- Name: curso_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.curso_id_seq OWNED BY public.curso.id;


--
-- TOC entry 254 (class 1259 OID 17062)
-- Name: escala_calificacion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.escala_calificacion (
    id integer NOT NULL,
    letra character varying(2) NOT NULL,
    descripcion character varying(50) NOT NULL,
    significado text NOT NULL,
    requiere_intervencion boolean DEFAULT false,
    estado smallint DEFAULT 1,
    CONSTRAINT escala_calificacion_estado_check CHECK ((estado = ANY (ARRAY[0, 1])))
);


--
-- TOC entry 253 (class 1259 OID 17061)
-- Name: escala_calificacion_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.escala_calificacion_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5322 (class 0 OID 0)
-- Dependencies: 253
-- Name: escala_calificacion_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.escala_calificacion_id_seq OWNED BY public.escala_calificacion.id;


--
-- TOC entry 236 (class 1259 OID 16834)
-- Name: estudiante; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.estudiante (
    id integer NOT NULL,
    dni character(8) NOT NULL,
    nombres character varying(100) NOT NULL,
    apellidos character varying(100) NOT NULL,
    correo character varying(150),
    telefono character varying(15),
    aula_id integer,
    padre_id integer,
    estado smallint DEFAULT 1,
    CONSTRAINT estudiante_estado_check CHECK ((estado = ANY (ARRAY[0, 1])))
);


--
-- TOC entry 235 (class 1259 OID 16833)
-- Name: estudiante_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.estudiante_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5323 (class 0 OID 0)
-- Dependencies: 235
-- Name: estudiante_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.estudiante_id_seq OWNED BY public.estudiante.id;


--
-- TOC entry 222 (class 1259 OID 16720)
-- Name: grado; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.grado (
    id integer NOT NULL,
    nombre character varying(50) NOT NULL,
    estado smallint DEFAULT 1,
    CONSTRAINT grado_estado_check CHECK ((estado = ANY (ARRAY[0, 1])))
);


--
-- TOC entry 221 (class 1259 OID 16719)
-- Name: grado_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.grado_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5324 (class 0 OID 0)
-- Dependencies: 221
-- Name: grado_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.grado_id_seq OWNED BY public.grado.id;


--
-- TOC entry 242 (class 1259 OID 16904)
-- Name: horario_detalle; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.horario_detalle (
    id integer NOT NULL,
    carga_id integer,
    dia_semana character varying(15) NOT NULL,
    hora_inicio time without time zone NOT NULL,
    hora_fin time without time zone NOT NULL,
    estado smallint DEFAULT 1,
    CONSTRAINT horario_detalle_estado_check CHECK ((estado = ANY (ARRAY[0, 1])))
);


--
-- TOC entry 241 (class 1259 OID 16903)
-- Name: horario_detalle_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.horario_detalle_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5325 (class 0 OID 0)
-- Dependencies: 241
-- Name: horario_detalle_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.horario_detalle_id_seq OWNED BY public.horario_detalle.id;


--
-- TOC entry 248 (class 1259 OID 16987)
-- Name: incidencia; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.incidencia (
    id integer NOT NULL,
    estudiante_id integer,
    registrado_por_id integer,
    tipo_incidencia character varying(50),
    descripcion text,
    fecha_registro timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    estado smallint DEFAULT 1,
    CONSTRAINT incidencia_estado_check CHECK ((estado = ANY (ARRAY[0, 1])))
);


--
-- TOC entry 247 (class 1259 OID 16986)
-- Name: incidencia_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.incidencia_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5326 (class 0 OID 0)
-- Dependencies: 247
-- Name: incidencia_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.incidencia_id_seq OWNED BY public.incidencia.id;


--
-- TOC entry 230 (class 1259 OID 16772)
-- Name: periodo_academico; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.periodo_academico (
    id integer NOT NULL,
    nombre character varying(50) NOT NULL,
    fecha_inicio date NOT NULL,
    fecha_fin date NOT NULL,
    esta_cerrado boolean DEFAULT false,
    estado smallint DEFAULT 1,
    anio_lectivo character varying(4) DEFAULT '2026'::character varying NOT NULL,
    numero integer DEFAULT 1 NOT NULL,
    CONSTRAINT periodo_academico_estado_check CHECK ((estado = ANY (ARRAY[0, 1]))),
    CONSTRAINT periodo_academico_numero_check CHECK ((numero = ANY (ARRAY[1, 2, 3, 4])))
);


--
-- TOC entry 229 (class 1259 OID 16771)
-- Name: periodo_academico_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.periodo_academico_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5327 (class 0 OID 0)
-- Dependencies: 229
-- Name: periodo_academico_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.periodo_academico_id_seq OWNED BY public.periodo_academico.id;


--
-- TOC entry 220 (class 1259 OID 16709)
-- Name: rol; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rol (
    id integer NOT NULL,
    nombre character varying(50) NOT NULL,
    estado smallint DEFAULT 1,
    CONSTRAINT rol_estado_check CHECK ((estado = ANY (ARRAY[0, 1])))
);


--
-- TOC entry 219 (class 1259 OID 16708)
-- Name: rol_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.rol_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5328 (class 0 OID 0)
-- Dependencies: 219
-- Name: rol_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.rol_id_seq OWNED BY public.rol.id;


--
-- TOC entry 224 (class 1259 OID 16731)
-- Name: seccion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.seccion (
    id integer NOT NULL,
    letra character(1) NOT NULL,
    estado smallint DEFAULT 1,
    CONSTRAINT seccion_estado_check CHECK ((estado = ANY (ARRAY[0, 1])))
);


--
-- TOC entry 223 (class 1259 OID 16730)
-- Name: seccion_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.seccion_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5329 (class 0 OID 0)
-- Dependencies: 223
-- Name: seccion_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.seccion_id_seq OWNED BY public.seccion.id;


--
-- TOC entry 252 (class 1259 OID 17044)
-- Name: semana_academica; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.semana_academica (
    id integer NOT NULL,
    periodo_id integer,
    numero_semana integer NOT NULL,
    estado smallint DEFAULT 1,
    CONSTRAINT semana_academica_estado_check CHECK ((estado = ANY (ARRAY[0, 1])))
);


--
-- TOC entry 251 (class 1259 OID 17043)
-- Name: semana_academica_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.semana_academica_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5330 (class 0 OID 0)
-- Dependencies: 251
-- Name: semana_academica_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.semana_academica_id_seq OWNED BY public.semana_academica.id;


--
-- TOC entry 232 (class 1259 OID 16786)
-- Name: usuario; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.usuario (
    id integer NOT NULL,
    dni character(8) NOT NULL,
    nombres character varying(100) NOT NULL,
    apellidos character varying(100) NOT NULL,
    correo character varying(150),
    telefono character varying(15),
    clave_hash text NOT NULL,
    rol_id integer,
    estado smallint DEFAULT 1,
    CONSTRAINT usuario_estado_check CHECK ((estado = ANY (ARRAY[0, 1])))
);


--
-- TOC entry 231 (class 1259 OID 16785)
-- Name: usuario_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.usuario_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5331 (class 0 OID 0)
-- Dependencies: 231
-- Name: usuario_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.usuario_id_seq OWNED BY public.usuario.id;


--
-- TOC entry 4989 (class 2604 OID 17013)
-- Name: alerta_riesgo id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alerta_riesgo ALTER COLUMN id SET DEFAULT nextval('public.alerta_riesgo_id_seq'::regclass);


--
-- TOC entry 5000 (class 2604 OID 17150)
-- Name: alumno_riesgo id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alumno_riesgo ALTER COLUMN id SET DEFAULT nextval('public.alumno_riesgo_id_seq'::regclass);


--
-- TOC entry 4974 (class 2604 OID 16862)
-- Name: asignacion_auxiliar id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asignacion_auxiliar ALTER COLUMN id SET DEFAULT nextval('public.asignacion_auxiliar_id_seq'::regclass);


--
-- TOC entry 4983 (class 2604 OID 16958)
-- Name: asistencia id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asistencia ALTER COLUMN id SET DEFAULT nextval('public.asistencia_id_seq'::regclass);


--
-- TOC entry 4970 (class 2604 OID 16814)
-- Name: aula id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.aula ALTER COLUMN id SET DEFAULT nextval('public.aula_id_seq'::regclass);


--
-- TOC entry 4980 (class 2604 OID 16925)
-- Name: calificacion id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calificacion ALTER COLUMN id SET DEFAULT nextval('public.calificacion_id_seq'::regclass);


--
-- TOC entry 4997 (class 2604 OID 17098)
-- Name: calificacion_bimestral id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calificacion_bimestral ALTER COLUMN id SET DEFAULT nextval('public.calificacion_bimestral_id_seq'::regclass);


--
-- TOC entry 4976 (class 2604 OID 16882)
-- Name: carga_academica id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carga_academica ALTER COLUMN id SET DEFAULT nextval('public.carga_academica_id_seq'::regclass);


--
-- TOC entry 4959 (class 2604 OID 16756)
-- Name: competencia id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.competencia ALTER COLUMN id SET DEFAULT nextval('public.competencia_id_seq'::regclass);


--
-- TOC entry 4957 (class 2604 OID 16745)
-- Name: curso id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.curso ALTER COLUMN id SET DEFAULT nextval('public.curso_id_seq'::regclass);


--
-- TOC entry 4994 (class 2604 OID 17065)
-- Name: escala_calificacion id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.escala_calificacion ALTER COLUMN id SET DEFAULT nextval('public.escala_calificacion_id_seq'::regclass);


--
-- TOC entry 4972 (class 2604 OID 16837)
-- Name: estudiante id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.estudiante ALTER COLUMN id SET DEFAULT nextval('public.estudiante_id_seq'::regclass);


--
-- TOC entry 4953 (class 2604 OID 16723)
-- Name: grado id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grado ALTER COLUMN id SET DEFAULT nextval('public.grado_id_seq'::regclass);


--
-- TOC entry 4978 (class 2604 OID 16907)
-- Name: horario_detalle id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.horario_detalle ALTER COLUMN id SET DEFAULT nextval('public.horario_detalle_id_seq'::regclass);


--
-- TOC entry 4986 (class 2604 OID 16990)
-- Name: incidencia id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incidencia ALTER COLUMN id SET DEFAULT nextval('public.incidencia_id_seq'::regclass);


--
-- TOC entry 4963 (class 2604 OID 16775)
-- Name: periodo_academico id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.periodo_academico ALTER COLUMN id SET DEFAULT nextval('public.periodo_academico_id_seq'::regclass);


--
-- TOC entry 4951 (class 2604 OID 16712)
-- Name: rol id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rol ALTER COLUMN id SET DEFAULT nextval('public.rol_id_seq'::regclass);


--
-- TOC entry 4955 (class 2604 OID 16734)
-- Name: seccion id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seccion ALTER COLUMN id SET DEFAULT nextval('public.seccion_id_seq'::regclass);


--
-- TOC entry 4992 (class 2604 OID 17047)
-- Name: semana_academica id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.semana_academica ALTER COLUMN id SET DEFAULT nextval('public.semana_academica_id_seq'::regclass);


--
-- TOC entry 4968 (class 2604 OID 16789)
-- Name: usuario id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuario ALTER COLUMN id SET DEFAULT nextval('public.usuario_id_seq'::regclass);


--
-- TOC entry 5297 (class 0 OID 17010)
-- Dependencies: 250
-- Data for Name: alerta_riesgo; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.alerta_riesgo (id, estudiante_id, nivel_riesgo, motivo, fecha_calculo, estado) VALUES (1, 1, 'Medio', 'Riesgo Académico Moderado: 2 competencias con nota ''C''.', '2026-05-11 15:47:50.718175', 0);
INSERT INTO public.alerta_riesgo (id, estudiante_id, nivel_riesgo, motivo, fecha_calculo, estado) VALUES (2, 1, 'Alto', 'Riesgo Académico Crítico: 3 competencias con nota ''C''.', '2026-05-11 15:51:18.807039', 0);
INSERT INTO public.alerta_riesgo (id, estudiante_id, nivel_riesgo, motivo, fecha_calculo, estado) VALUES (3, 1, 'Alto', 'Riesgo Académico Crítico: 5 competencias con nota ''C''.', '2026-05-11 16:37:29.947513', 0);
INSERT INTO public.alerta_riesgo (id, estudiante_id, nivel_riesgo, motivo, fecha_calculo, estado) VALUES (4, 1, 'Alto', 'Inasistencia Crítica: 0 faltas y 1 tardanzas (25 % de inasistencia).', '2026-05-11 16:57:07.811884', 0);
INSERT INTO public.alerta_riesgo (id, estudiante_id, nivel_riesgo, motivo, fecha_calculo, estado) VALUES (5, 1, 'Alto', 'Inasistencia Crítica: 0 faltas y 1 tardanzas (25 % de inasistencia).', '2026-05-11 18:03:11.111854', 0);
INSERT INTO public.alerta_riesgo (id, estudiante_id, nivel_riesgo, motivo, fecha_calculo, estado) VALUES (6, 1, 'Alto', 'Inasistencia Crítica: 0 faltas y 1 tardanzas (25 % de inasistencia).', '2026-05-11 18:03:19.952673', 0);
INSERT INTO public.alerta_riesgo (id, estudiante_id, nivel_riesgo, motivo, fecha_calculo, estado) VALUES (7, 1, 'Alto', 'Inasistencia Crítica: 1 faltas y 0 tardanzas (50 % de inasistencia).', '2026-05-11 18:05:33.426356', 0);
INSERT INTO public.alerta_riesgo (id, estudiante_id, nivel_riesgo, motivo, fecha_calculo, estado) VALUES (8, 1, 'Alto', 'Inasistencia Crítica: 0 faltas y 1 tardanzas (25 % de inasistencia).', '2026-05-11 18:08:13.59124', 1);


--
-- TOC entry 5305 (class 0 OID 17147)
-- Dependencies: 258
-- Data for Name: alumno_riesgo; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 5285 (class 0 OID 16859)
-- Dependencies: 238
-- Data for Name: asignacion_auxiliar; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.asignacion_auxiliar (id, auxiliar_id, aula_id, periodo_lectivo, estado) VALUES (3, 4, 4, '2026', 1);
INSERT INTO public.asignacion_auxiliar (id, auxiliar_id, aula_id, periodo_lectivo, estado) VALUES (4, 4, 3, '2026', 1);
INSERT INTO public.asignacion_auxiliar (id, auxiliar_id, aula_id, periodo_lectivo, estado) VALUES (6, 4, 1, '2026', 1);


--
-- TOC entry 5293 (class 0 OID 16955)
-- Dependencies: 246
-- Data for Name: asistencia; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.asistencia (id, estudiante_id, registrado_por_id, carga_academica_id, asignacion_auxiliar_id, fecha, valor, estado) VALUES (1, 1, 2, 8, NULL, '2026-05-11', 'P', 1);
INSERT INTO public.asistencia (id, estudiante_id, registrado_por_id, carga_academica_id, asignacion_auxiliar_id, fecha, valor, estado) VALUES (4, 1, 2, 2, 6, '2026-05-11', 'T', 1);


--
-- TOC entry 5281 (class 0 OID 16811)
-- Dependencies: 234
-- Data for Name: aula; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.aula (id, descripcion, capacidad, grado_id, seccion_id, estado) VALUES (3, 'Aula 201 - Pabellón B', 30, 2, 1, 1);
INSERT INTO public.aula (id, descripcion, capacidad, grado_id, seccion_id, estado) VALUES (1, 'Aula 101 - Pabellón A', 30, 5, 3, 1);
INSERT INTO public.aula (id, descripcion, capacidad, grado_id, seccion_id, estado) VALUES (2, 'Aula 102 - Pabellón A', 30, 4, 2, 1);
INSERT INTO public.aula (id, descripcion, capacidad, grado_id, seccion_id, estado) VALUES (4, 'aula 202', 15, 1, 1, 1);


--
-- TOC entry 5291 (class 0 OID 16922)
-- Dependencies: 244
-- Data for Name: calificacion; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.calificacion (id, estudiante_id, competencia_id, fecha_registro, estado, semana_id, escala_id) VALUES (1, 1, 9, '2026-05-11 15:28:47.418663', 1, 38, 2);
INSERT INTO public.calificacion (id, estudiante_id, competencia_id, fecha_registro, estado, semana_id, escala_id) VALUES (2, 1, 10, '2026-05-11 15:47:50.608677', 1, 38, 4);
INSERT INTO public.calificacion (id, estudiante_id, competencia_id, fecha_registro, estado, semana_id, escala_id) VALUES (3, 1, 11, '2026-05-11 15:47:50.608677', 1, 38, 4);
INSERT INTO public.calificacion (id, estudiante_id, competencia_id, fecha_registro, estado, semana_id, escala_id) VALUES (4, 1, 9, '2026-05-11 15:51:18.794623', 1, 39, 2);
INSERT INTO public.calificacion (id, estudiante_id, competencia_id, fecha_registro, estado, semana_id, escala_id) VALUES (5, 1, 10, '2026-05-11 15:51:18.794623', 1, 39, 3);
INSERT INTO public.calificacion (id, estudiante_id, competencia_id, fecha_registro, estado, semana_id, escala_id) VALUES (6, 1, 11, '2026-05-11 15:51:18.794623', 1, 39, 4);
INSERT INTO public.calificacion (id, estudiante_id, competencia_id, fecha_registro, estado, semana_id, escala_id) VALUES (7, 1, 13, '2026-05-11 16:37:29.783315', 1, 38, 2);
INSERT INTO public.calificacion (id, estudiante_id, competencia_id, fecha_registro, estado, semana_id, escala_id) VALUES (8, 1, 14, '2026-05-11 16:37:29.783315', 1, 38, 3);
INSERT INTO public.calificacion (id, estudiante_id, competencia_id, fecha_registro, estado, semana_id, escala_id) VALUES (9, 1, 15, '2026-05-11 16:37:29.783315', 1, 38, 4);
INSERT INTO public.calificacion (id, estudiante_id, competencia_id, fecha_registro, estado, semana_id, escala_id) VALUES (10, 1, 16, '2026-05-11 16:37:29.783315', 1, 38, 4);


--
-- TOC entry 5303 (class 0 OID 17095)
-- Dependencies: 256
-- Data for Name: calificacion_bimestral; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 5287 (class 0 OID 16879)
-- Dependencies: 240
-- Data for Name: carga_academica; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.carga_academica (id, docente_id, curso_id, aula_id, periodo_lectivo, estado) VALUES (3, NULL, 4, 4, '2026', 0);
INSERT INTO public.carga_academica (id, docente_id, curso_id, aula_id, periodo_lectivo, estado) VALUES (5, NULL, 4, 4, '2026', 0);
INSERT INTO public.carga_academica (id, docente_id, curso_id, aula_id, periodo_lectivo, estado) VALUES (6, NULL, 4, 3, '2026', 0);
INSERT INTO public.carga_academica (id, docente_id, curso_id, aula_id, periodo_lectivo, estado) VALUES (1, 6, 1, 1, '2026', 1);
INSERT INTO public.carga_academica (id, docente_id, curso_id, aula_id, periodo_lectivo, estado) VALUES (2, 2, 4, 1, '2026', 1);
INSERT INTO public.carga_academica (id, docente_id, curso_id, aula_id, periodo_lectivo, estado) VALUES (4, 2, 4, 2, '2026', 1);
INSERT INTO public.carga_academica (id, docente_id, curso_id, aula_id, periodo_lectivo, estado) VALUES (8, 2, 4, 4, '2026', 1);
INSERT INTO public.carga_academica (id, docente_id, curso_id, aula_id, periodo_lectivo, estado) VALUES (7, 2, 1, 4, '2026', 1);


--
-- TOC entry 5275 (class 0 OID 16753)
-- Dependencies: 228
-- Data for Name: competencia; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.competencia (id, curso_id, nombre, numero_orden, estado, carga_id, peso, codigo) VALUES (1, 1, 'Resuelve problemas de cantidad', 1, 1, NULL, 1.00, 'C1');
INSERT INTO public.competencia (id, curso_id, nombre, numero_orden, estado, carga_id, peso, codigo) VALUES (2, 1, 'Resuelve problemas de regularidad, equivalencia y cambio', 2, 1, NULL, 1.00, 'C2');
INSERT INTO public.competencia (id, curso_id, nombre, numero_orden, estado, carga_id, peso, codigo) VALUES (3, 1, 'Resuelve problemas de forma, movimiento y localización', 3, 1, NULL, 1.00, 'C3');
INSERT INTO public.competencia (id, curso_id, nombre, numero_orden, estado, carga_id, peso, codigo) VALUES (4, 1, 'Resuelve problemas de gestión de datos e incertidumbre', 4, 1, NULL, 1.00, 'C4');
INSERT INTO public.competencia (id, curso_id, nombre, numero_orden, estado, carga_id, peso, codigo) VALUES (5, 2, 'Se comunica oralmente en su lengua materna', 1, 1, NULL, 1.00, 'C1');
INSERT INTO public.competencia (id, curso_id, nombre, numero_orden, estado, carga_id, peso, codigo) VALUES (6, 2, 'Lee diversos tipos de textos escritos en su lengua materna', 2, 1, NULL, 1.00, 'C2');
INSERT INTO public.competencia (id, curso_id, nombre, numero_orden, estado, carga_id, peso, codigo) VALUES (7, 2, 'Escribe diversos tipos de textos en su lengua materna', 3, 1, NULL, 1.00, 'C3');
INSERT INTO public.competencia (id, curso_id, nombre, numero_orden, estado, carga_id, peso, codigo) VALUES (8, NULL, 'c1', 1, 0, 2, 1.00, 'C1');
INSERT INTO public.competencia (id, curso_id, nombre, numero_orden, estado, carga_id, peso, codigo) VALUES (12, NULL, 'd', 5, 0, 2, 1.00, 'C4');
INSERT INTO public.competencia (id, curso_id, nombre, numero_orden, estado, carga_id, peso, codigo) VALUES (9, NULL, 'c2', 2, 0, 2, 1.00, 'C2');
INSERT INTO public.competencia (id, curso_id, nombre, numero_orden, estado, carga_id, peso, codigo) VALUES (10, NULL, 'c3', 3, 0, 2, 1.00, 'C3');
INSERT INTO public.competencia (id, curso_id, nombre, numero_orden, estado, carga_id, peso, codigo) VALUES (11, NULL, 'c4', 4, 0, 2, 1.00, 'C4');
INSERT INTO public.competencia (id, curso_id, nombre, numero_orden, estado, carga_id, peso, codigo) VALUES (13, NULL, 'EJEMPLO 1', 1, 1, 2, 1.00, 'C1');
INSERT INTO public.competencia (id, curso_id, nombre, numero_orden, estado, carga_id, peso, codigo) VALUES (14, NULL, 'EJEMPLO 2', 2, 1, 2, 1.00, 'C2');
INSERT INTO public.competencia (id, curso_id, nombre, numero_orden, estado, carga_id, peso, codigo) VALUES (15, NULL, 'EJEMPLO4', 3, 1, 2, 1.00, 'C3');
INSERT INTO public.competencia (id, curso_id, nombre, numero_orden, estado, carga_id, peso, codigo) VALUES (16, NULL, 'EJEMPLO 5', 4, 1, 2, 1.00, 'C4');


--
-- TOC entry 5273 (class 0 OID 16742)
-- Dependencies: 226
-- Data for Name: curso; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.curso (id, nombre, estado) VALUES (1, 'Matemática', 1);
INSERT INTO public.curso (id, nombre, estado) VALUES (2, 'Comunicación', 1);
INSERT INTO public.curso (id, nombre, estado) VALUES (3, 'Ciencias Sociales', 1);
INSERT INTO public.curso (id, nombre, estado) VALUES (4, 'Desarrollo Personal, Ciudadanía y Cívica (DPCC)', 1);
INSERT INTO public.curso (id, nombre, estado) VALUES (5, 'Educacion Fisica', 1);


--
-- TOC entry 5301 (class 0 OID 17062)
-- Dependencies: 254
-- Data for Name: escala_calificacion; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.escala_calificacion (id, letra, descripcion, significado, requiere_intervencion, estado) VALUES (1, 'AD', 'Logro Destacado', 'El estudiante evidencia un nivel superior a lo esperado respecto a la competencia.', false, 1);
INSERT INTO public.escala_calificacion (id, letra, descripcion, significado, requiere_intervencion, estado) VALUES (2, 'A', 'Logro Previsto', 'El estudiante cumple satisfactoriamente con el nivel esperado en el tiempo programado.', false, 1);
INSERT INTO public.escala_calificacion (id, letra, descripcion, significado, requiere_intervencion, estado) VALUES (3, 'B', 'En Proceso', 'El estudiante está próximo o cerca del nivel esperado y requiere acompañamiento.', false, 1);
INSERT INTO public.escala_calificacion (id, letra, descripcion, significado, requiere_intervencion, estado) VALUES (4, 'C', 'En Inicio', 'El estudiante muestra un progreso mínimo y necesita intervención pedagógica urgente.', true, 1);


--
-- TOC entry 5283 (class 0 OID 16834)
-- Dependencies: 236
-- Data for Name: estudiante; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.estudiante (id, dni, nombres, apellidos, correo, telefono, aula_id, padre_id, estado) VALUES (1, '12345679', 'Jerson', 'marin', NULL, '123456789', 1, 5, 1);
INSERT INTO public.estudiante (id, dni, nombres, apellidos, correo, telefono, aula_id, padre_id, estado) VALUES (2, '13467912', 'Jerson', 'Jorge', 'jerson.29@gmail.com', '123456789', 2, 5, 1);


--
-- TOC entry 5269 (class 0 OID 16720)
-- Dependencies: 222
-- Data for Name: grado; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.grado (id, nombre, estado) VALUES (1, '1ro Secundaria', 1);
INSERT INTO public.grado (id, nombre, estado) VALUES (2, '2do Secundaria', 1);
INSERT INTO public.grado (id, nombre, estado) VALUES (3, '3ro Secundaria', 1);
INSERT INTO public.grado (id, nombre, estado) VALUES (4, '4to Secundaria', 1);
INSERT INTO public.grado (id, nombre, estado) VALUES (5, '5to Secundaria', 1);


--
-- TOC entry 5289 (class 0 OID 16904)
-- Dependencies: 242
-- Data for Name: horario_detalle; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.horario_detalle (id, carga_id, dia_semana, hora_inicio, hora_fin, estado) VALUES (13, 4, 'Miércoles', '08:00:00', '09:00:00', 1);
INSERT INTO public.horario_detalle (id, carga_id, dia_semana, hora_inicio, hora_fin, estado) VALUES (14, 4, 'Miércoles', '13:00:00', '15:00:00', 1);
INSERT INTO public.horario_detalle (id, carga_id, dia_semana, hora_inicio, hora_fin, estado) VALUES (19, 1, 'Miércoles', '21:00:00', '22:30:00', 1);
INSERT INTO public.horario_detalle (id, carga_id, dia_semana, hora_inicio, hora_fin, estado) VALUES (20, 1, 'Miércoles', '14:00:00', '19:30:00', 1);
INSERT INTO public.horario_detalle (id, carga_id, dia_semana, hora_inicio, hora_fin, estado) VALUES (22, 7, 'Lunes', '08:00:00', '09:00:00', 1);
INSERT INTO public.horario_detalle (id, carga_id, dia_semana, hora_inicio, hora_fin, estado) VALUES (25, 8, 'Martes', '13:00:00', '23:00:00', 1);
INSERT INTO public.horario_detalle (id, carga_id, dia_semana, hora_inicio, hora_fin, estado) VALUES (26, 2, 'Lunes', '11:00:00', '23:00:00', 1);


--
-- TOC entry 5295 (class 0 OID 16987)
-- Dependencies: 248
-- Data for Name: incidencia; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.incidencia (id, estudiante_id, registrado_por_id, tipo_incidencia, descripcion, fecha_registro, estado) VALUES (1, 1, 4, 'Tardanza Justificada', '', '2026-05-11 17:51:35.160897', 1);
INSERT INTO public.incidencia (id, estudiante_id, registrado_por_id, tipo_incidencia, descripcion, fecha_registro, estado) VALUES (2, 1, 4, 'Salud', 'justificado', '2026-05-11 17:56:31.748306', 1);
INSERT INTO public.incidencia (id, estudiante_id, registrado_por_id, tipo_incidencia, descripcion, fecha_registro, estado) VALUES (3, 1, 4, 'Conducta', 'j', '2026-05-11 18:01:03.707105', 1);


--
-- TOC entry 5277 (class 0 OID 16772)
-- Dependencies: 230
-- Data for Name: periodo_academico; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.periodo_academico (id, nombre, fecha_inicio, fecha_fin, esta_cerrado, estado, anio_lectivo, numero) VALUES (1, '1° Bimestre', '2026-03-16', '2026-05-15', false, 1, '2026', 1);
INSERT INTO public.periodo_academico (id, nombre, fecha_inicio, fecha_fin, esta_cerrado, estado, anio_lectivo, numero) VALUES (2, '2° Bimestre', '2026-05-18', '2026-07-24', false, 1, '2026', 2);
INSERT INTO public.periodo_academico (id, nombre, fecha_inicio, fecha_fin, esta_cerrado, estado, anio_lectivo, numero) VALUES (3, '3° Bimestre', '2026-08-10', '2026-10-09', false, 1, '2026', 3);
INSERT INTO public.periodo_academico (id, nombre, fecha_inicio, fecha_fin, esta_cerrado, estado, anio_lectivo, numero) VALUES (4, '4° Bimestre', '2026-10-12', '2026-12-18', false, 1, '2026', 4);


--
-- TOC entry 5267 (class 0 OID 16709)
-- Dependencies: 220
-- Data for Name: rol; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.rol (id, nombre, estado) VALUES (1, 'Director', 1);
INSERT INTO public.rol (id, nombre, estado) VALUES (2, 'Docente', 1);
INSERT INTO public.rol (id, nombre, estado) VALUES (3, 'Auxiliar', 1);
INSERT INTO public.rol (id, nombre, estado) VALUES (4, 'Padre', 1);
INSERT INTO public.rol (id, nombre, estado) VALUES (5, 'Administrativo', 1);



--
-- TOC entry 5271 (class 0 OID 16731)
-- Dependencies: 224
-- Data for Name: seccion; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.seccion (id, letra, estado) VALUES (1, 'A', 1);
INSERT INTO public.seccion (id, letra, estado) VALUES (2, 'B', 1);
INSERT INTO public.seccion (id, letra, estado) VALUES (3, 'C', 1);


--
-- TOC entry 5299 (class 0 OID 17044)
-- Dependencies: 252
-- Data for Name: semana_academica; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.semana_academica (id, periodo_id, numero_semana, estado) VALUES (38, 1, 1, 1);
INSERT INTO public.semana_academica (id, periodo_id, numero_semana, estado) VALUES (39, 1, 2, 1);
INSERT INTO public.semana_academica (id, periodo_id, numero_semana, estado) VALUES (40, 1, 3, 1);
INSERT INTO public.semana_academica (id, periodo_id, numero_semana, estado) VALUES (41, 1, 4, 1);
INSERT INTO public.semana_academica (id, periodo_id, numero_semana, estado) VALUES (42, 1, 5, 1);
INSERT INTO public.semana_academica (id, periodo_id, numero_semana, estado) VALUES (43, 1, 6, 1);
INSERT INTO public.semana_academica (id, periodo_id, numero_semana, estado) VALUES (44, 1, 7, 1);
INSERT INTO public.semana_academica (id, periodo_id, numero_semana, estado) VALUES (45, 1, 8, 1);
INSERT INTO public.semana_academica (id, periodo_id, numero_semana, estado) VALUES (46, 1, 9, 1);
INSERT INTO public.semana_academica (id, periodo_id, numero_semana, estado) VALUES (47, 2, 1, 1);
INSERT INTO public.semana_academica (id, periodo_id, numero_semana, estado) VALUES (48, 2, 2, 1);
INSERT INTO public.semana_academica (id, periodo_id, numero_semana, estado) VALUES (49, 2, 3, 1);
INSERT INTO public.semana_academica (id, periodo_id, numero_semana, estado) VALUES (50, 2, 4, 1);
INSERT INTO public.semana_academica (id, periodo_id, numero_semana, estado) VALUES (51, 2, 5, 1);
INSERT INTO public.semana_academica (id, periodo_id, numero_semana, estado) VALUES (52, 2, 6, 1);
INSERT INTO public.semana_academica (id, periodo_id, numero_semana, estado) VALUES (53, 2, 7, 1);
INSERT INTO public.semana_academica (id, periodo_id, numero_semana, estado) VALUES (54, 2, 8, 1);
INSERT INTO public.semana_academica (id, periodo_id, numero_semana, estado) VALUES (55, 2, 9, 1);
INSERT INTO public.semana_academica (id, periodo_id, numero_semana, estado) VALUES (56, 3, 1, 1);
INSERT INTO public.semana_academica (id, periodo_id, numero_semana, estado) VALUES (57, 3, 2, 1);
INSERT INTO public.semana_academica (id, periodo_id, numero_semana, estado) VALUES (58, 3, 3, 1);
INSERT INTO public.semana_academica (id, periodo_id, numero_semana, estado) VALUES (59, 3, 4, 1);
INSERT INTO public.semana_academica (id, periodo_id, numero_semana, estado) VALUES (60, 3, 5, 1);
INSERT INTO public.semana_academica (id, periodo_id, numero_semana, estado) VALUES (61, 3, 6, 1);
INSERT INTO public.semana_academica (id, periodo_id, numero_semana, estado) VALUES (62, 3, 7, 1);
INSERT INTO public.semana_academica (id, periodo_id, numero_semana, estado) VALUES (63, 3, 8, 1);
INSERT INTO public.semana_academica (id, periodo_id, numero_semana, estado) VALUES (64, 3, 9, 1);
INSERT INTO public.semana_academica (id, periodo_id, numero_semana, estado) VALUES (65, 4, 1, 1);
INSERT INTO public.semana_academica (id, periodo_id, numero_semana, estado) VALUES (66, 4, 2, 1);
INSERT INTO public.semana_academica (id, periodo_id, numero_semana, estado) VALUES (67, 4, 3, 1);
INSERT INTO public.semana_academica (id, periodo_id, numero_semana, estado) VALUES (68, 4, 4, 1);
INSERT INTO public.semana_academica (id, periodo_id, numero_semana, estado) VALUES (69, 4, 5, 1);
INSERT INTO public.semana_academica (id, periodo_id, numero_semana, estado) VALUES (70, 4, 6, 1);
INSERT INTO public.semana_academica (id, periodo_id, numero_semana, estado) VALUES (71, 4, 7, 1);
INSERT INTO public.semana_academica (id, periodo_id, numero_semana, estado) VALUES (72, 4, 8, 1);
INSERT INTO public.semana_academica (id, periodo_id, numero_semana, estado) VALUES (73, 4, 9, 1);
INSERT INTO public.semana_academica (id, periodo_id, numero_semana, estado) VALUES (74, 4, 10, 1);


--
-- TOC entry 5279 (class 0 OID 16786)
-- Dependencies: 232
-- Data for Name: usuario; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.usuario (id, dni, nombres, apellidos, correo, telefono, clave_hash, rol_id, estado) VALUES (1, '11111111', 'Ana', 'Pérez', 'directora@kumamoto.edu.pe', '987654321', '123456', 1, 1);
INSERT INTO public.usuario (id, dni, nombres, apellidos, correo, telefono, clave_hash, rol_id, estado) VALUES (2, '22222222', 'Carlos', 'Mendoza', 'cmendoza@kumamoto.edu.pe', '999888777', '123456', 2, 1);
INSERT INTO public.usuario (id, dni, nombres, apellidos, correo, telefono, clave_hash, rol_id, estado) VALUES (4, '44444444', 'Jorge', 'Salinas', 'jsalinas@kumamoto.edu.pe', '922333444', '123456', 3, 1);
INSERT INTO public.usuario (id, dni, nombres, apellidos, correo, telefono, clave_hash, rol_id, estado) VALUES (6, '13467966', 'Prueba docente 4', 'Quispee', 'pquispe@kumamoto.edu.pe', '999999998', 'Kuma13467966', 2, 1);
INSERT INTO public.usuario (id, dni, nombres, apellidos, correo, telefono, clave_hash, rol_id, estado) VALUES (3, '33333333', 'María', 'López', 'mlopez@kumamoto.edu.pe', '911222333', '123456', 2, 1);
INSERT INTO public.usuario (id, dni, nombres, apellidos, correo, telefono, clave_hash, rol_id, estado) VALUES (5, '12345678', 'Jerso', 'mari', '12345678@kumamoto.edu.pe', '123456784', '123456', 4, 1);


--
-- TOC entry 5332 (class 0 OID 0)
-- Dependencies: 249
-- Name: alerta_riesgo_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.alerta_riesgo_id_seq', 8, true);


--
-- TOC entry 5333 (class 0 OID 0)
-- Dependencies: 257
-- Name: alumno_riesgo_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.alumno_riesgo_id_seq', 1, false);


--
-- TOC entry 5334 (class 0 OID 0)
-- Dependencies: 237
-- Name: asignacion_auxiliar_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.asignacion_auxiliar_id_seq', 6, true);


--
-- TOC entry 5335 (class 0 OID 0)
-- Dependencies: 245
-- Name: asistencia_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.asistencia_id_seq', 4, true);


--
-- TOC entry 5336 (class 0 OID 0)
-- Dependencies: 233
-- Name: aula_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.aula_id_seq', 4, true);


--
-- TOC entry 5337 (class 0 OID 0)
-- Dependencies: 255
-- Name: calificacion_bimestral_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.calificacion_bimestral_id_seq', 1, false);


--
-- TOC entry 5338 (class 0 OID 0)
-- Dependencies: 243
-- Name: calificacion_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.calificacion_id_seq', 10, true);


--
-- TOC entry 5339 (class 0 OID 0)
-- Dependencies: 239
-- Name: carga_academica_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.carga_academica_id_seq', 8, true);


--
-- TOC entry 5340 (class 0 OID 0)
-- Dependencies: 227
-- Name: competencia_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.competencia_id_seq', 16, true);


--
-- TOC entry 5341 (class 0 OID 0)
-- Dependencies: 225
-- Name: curso_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.curso_id_seq', 5, true);


--
-- TOC entry 5342 (class 0 OID 0)
-- Dependencies: 253
-- Name: escala_calificacion_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.escala_calificacion_id_seq', 4, true);


--
-- TOC entry 5343 (class 0 OID 0)
-- Dependencies: 235
-- Name: estudiante_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.estudiante_id_seq', 2, true);


--
-- TOC entry 5344 (class 0 OID 0)
-- Dependencies: 221
-- Name: grado_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.grado_id_seq', 5, true);


--
-- TOC entry 5345 (class 0 OID 0)
-- Dependencies: 241
-- Name: horario_detalle_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.horario_detalle_id_seq', 26, true);


--
-- TOC entry 5346 (class 0 OID 0)
-- Dependencies: 247
-- Name: incidencia_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.incidencia_id_seq', 3, true);


--
-- TOC entry 5347 (class 0 OID 0)
-- Dependencies: 229
-- Name: periodo_academico_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.periodo_academico_id_seq', 5, true);


--
-- TOC entry 5348 (class 0 OID 0)
-- Dependencies: 219
-- Name: rol_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.rol_id_seq', 4, true);


--
-- TOC entry 5349 (class 0 OID 0)
-- Dependencies: 223
-- Name: seccion_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.seccion_id_seq', 3, true);


--
-- TOC entry 5350 (class 0 OID 0)
-- Dependencies: 251
-- Name: semana_academica_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.semana_academica_id_seq', 74, true);


--
-- TOC entry 5351 (class 0 OID 0)
-- Dependencies: 231
-- Name: usuario_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.usuario_id_seq', 6, true);


--
-- TOC entry 5073 (class 2606 OID 17021)
-- Name: alerta_riesgo alerta_riesgo_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alerta_riesgo
    ADD CONSTRAINT alerta_riesgo_pkey PRIMARY KEY (id);


--
-- TOC entry 5087 (class 2606 OID 17160)
-- Name: alumno_riesgo alumno_riesgo_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alumno_riesgo
    ADD CONSTRAINT alumno_riesgo_pkey PRIMARY KEY (id);


--
-- TOC entry 5057 (class 2606 OID 16867)
-- Name: asignacion_auxiliar asignacion_auxiliar_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asignacion_auxiliar
    ADD CONSTRAINT asignacion_auxiliar_pkey PRIMARY KEY (id);


--
-- TOC entry 5068 (class 2606 OID 16965)
-- Name: asistencia asistencia_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asistencia
    ADD CONSTRAINT asistencia_pkey PRIMARY KEY (id);


--
-- TOC entry 5048 (class 2606 OID 16820)
-- Name: aula aula_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.aula
    ADD CONSTRAINT aula_pkey PRIMARY KEY (id);


--
-- TOC entry 5083 (class 2606 OID 17104)
-- Name: calificacion_bimestral calificacion_bimestral_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calificacion_bimestral
    ADD CONSTRAINT calificacion_bimestral_pkey PRIMARY KEY (id);


--
-- TOC entry 5064 (class 2606 OID 16933)
-- Name: calificacion calificacion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calificacion
    ADD CONSTRAINT calificacion_pkey PRIMARY KEY (id);


--
-- TOC entry 5059 (class 2606 OID 16887)
-- Name: carga_academica carga_academica_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carga_academica
    ADD CONSTRAINT carga_academica_pkey PRIMARY KEY (id);


--
-- TOC entry 5034 (class 2606 OID 16763)
-- Name: competencia competencia_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.competencia
    ADD CONSTRAINT competencia_pkey PRIMARY KEY (id);


--
-- TOC entry 5032 (class 2606 OID 16751)
-- Name: curso curso_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.curso
    ADD CONSTRAINT curso_pkey PRIMARY KEY (id);


--
-- TOC entry 5079 (class 2606 OID 17078)
-- Name: escala_calificacion escala_calificacion_letra_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.escala_calificacion
    ADD CONSTRAINT escala_calificacion_letra_key UNIQUE (letra);


--
-- TOC entry 5081 (class 2606 OID 17076)
-- Name: escala_calificacion escala_calificacion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.escala_calificacion
    ADD CONSTRAINT escala_calificacion_pkey PRIMARY KEY (id);


--
-- TOC entry 5052 (class 2606 OID 16847)
-- Name: estudiante estudiante_dni_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.estudiante
    ADD CONSTRAINT estudiante_dni_key UNIQUE (dni);


--
-- TOC entry 5054 (class 2606 OID 16845)
-- Name: estudiante estudiante_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.estudiante
    ADD CONSTRAINT estudiante_pkey PRIMARY KEY (id);


--
-- TOC entry 5028 (class 2606 OID 16729)
-- Name: grado grado_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grado
    ADD CONSTRAINT grado_pkey PRIMARY KEY (id);


--
-- TOC entry 5062 (class 2606 OID 16915)
-- Name: horario_detalle horario_detalle_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.horario_detalle
    ADD CONSTRAINT horario_detalle_pkey PRIMARY KEY (id);


--
-- TOC entry 5071 (class 2606 OID 16998)
-- Name: incidencia incidencia_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incidencia
    ADD CONSTRAINT incidencia_pkey PRIMARY KEY (id);


--
-- TOC entry 5038 (class 2606 OID 16784)
-- Name: periodo_academico periodo_academico_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.periodo_academico
    ADD CONSTRAINT periodo_academico_pkey PRIMARY KEY (id);


--
-- TOC entry 5026 (class 2606 OID 16718)
-- Name: rol rol_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rol
    ADD CONSTRAINT rol_pkey PRIMARY KEY (id);


--
-- TOC entry 5030 (class 2606 OID 16740)
-- Name: seccion seccion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seccion
    ADD CONSTRAINT seccion_pkey PRIMARY KEY (id);


--
-- TOC entry 5075 (class 2606 OID 17053)
-- Name: semana_academica semana_academica_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.semana_academica
    ADD CONSTRAINT semana_academica_pkey PRIMARY KEY (id);


--
-- TOC entry 5085 (class 2606 OID 17106)
-- Name: calificacion_bimestral uc_calificacion_bimestral; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calificacion_bimestral
    ADD CONSTRAINT uc_calificacion_bimestral UNIQUE (estudiante_id, competencia_id, periodo_id);


--
-- TOC entry 5066 (class 2606 OID 17093)
-- Name: calificacion uc_calificacion_semana; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calificacion
    ADD CONSTRAINT uc_calificacion_semana UNIQUE (estudiante_id, competencia_id, semana_id);


--
-- TOC entry 5036 (class 2606 OID 16765)
-- Name: competencia uc_curso_orden; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.competencia
    ADD CONSTRAINT uc_curso_orden UNIQUE (curso_id, numero_orden);


--
-- TOC entry 5050 (class 2606 OID 16822)
-- Name: aula uc_grado_seccion; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.aula
    ADD CONSTRAINT uc_grado_seccion UNIQUE (grado_id, seccion_id);


--
-- TOC entry 5040 (class 2606 OID 17139)
-- Name: periodo_academico uc_periodo_anio_numero; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.periodo_academico
    ADD CONSTRAINT uc_periodo_anio_numero UNIQUE (anio_lectivo, numero);


--
-- TOC entry 5077 (class 2606 OID 17055)
-- Name: semana_academica uc_periodo_semana; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.semana_academica
    ADD CONSTRAINT uc_periodo_semana UNIQUE (periodo_id, numero_semana);


--
-- TOC entry 5042 (class 2606 OID 16804)
-- Name: usuario usuario_correo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_correo_key UNIQUE (correo);


--
-- TOC entry 5044 (class 2606 OID 16802)
-- Name: usuario usuario_dni_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_dni_key UNIQUE (dni);


--
-- TOC entry 5046 (class 2606 OID 16800)
-- Name: usuario usuario_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_pkey PRIMARY KEY (id);


--
-- TOC entry 5088 (class 1259 OID 17166)
-- Name: idx_alumno_riesgo_estudiante; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_alumno_riesgo_estudiante ON public.alumno_riesgo USING btree (estudiante_id);


--
-- TOC entry 5069 (class 1259 OID 17143)
-- Name: ix_asistencia_reporte_lookup; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_asistencia_reporte_lookup ON public.asistencia USING btree (fecha, carga_academica_id, estudiante_id);


--
-- TOC entry 5060 (class 1259 OID 17144)
-- Name: ix_carga_academica_aula; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_carga_academica_aula ON public.carga_academica USING btree (aula_id);


--
-- TOC entry 5055 (class 1259 OID 17145)
-- Name: ix_estudiante_aula; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_estudiante_aula ON public.estudiante USING btree (aula_id);


--
-- TOC entry 5112 (class 2606 OID 17022)
-- Name: alerta_riesgo alerta_riesgo_estudiante_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alerta_riesgo
    ADD CONSTRAINT alerta_riesgo_estudiante_id_fkey FOREIGN KEY (estudiante_id) REFERENCES public.estudiante(id);


--
-- TOC entry 5118 (class 2606 OID 17161)
-- Name: alumno_riesgo alumno_riesgo_estudiante_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alumno_riesgo
    ADD CONSTRAINT alumno_riesgo_estudiante_id_fkey FOREIGN KEY (estudiante_id) REFERENCES public.estudiante(id);


--
-- TOC entry 5096 (class 2606 OID 16873)
-- Name: asignacion_auxiliar asignacion_auxiliar_aula_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asignacion_auxiliar
    ADD CONSTRAINT asignacion_auxiliar_aula_id_fkey FOREIGN KEY (aula_id) REFERENCES public.aula(id);


--
-- TOC entry 5097 (class 2606 OID 16868)
-- Name: asignacion_auxiliar asignacion_auxiliar_auxiliar_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asignacion_auxiliar
    ADD CONSTRAINT asignacion_auxiliar_auxiliar_id_fkey FOREIGN KEY (auxiliar_id) REFERENCES public.usuario(id);


--
-- TOC entry 5106 (class 2606 OID 16981)
-- Name: asistencia asistencia_asignacion_auxiliar_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asistencia
    ADD CONSTRAINT asistencia_asignacion_auxiliar_id_fkey FOREIGN KEY (asignacion_auxiliar_id) REFERENCES public.asignacion_auxiliar(id);


--
-- TOC entry 5107 (class 2606 OID 16976)
-- Name: asistencia asistencia_carga_academica_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asistencia
    ADD CONSTRAINT asistencia_carga_academica_id_fkey FOREIGN KEY (carga_academica_id) REFERENCES public.carga_academica(id);


--
-- TOC entry 5108 (class 2606 OID 16966)
-- Name: asistencia asistencia_estudiante_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asistencia
    ADD CONSTRAINT asistencia_estudiante_id_fkey FOREIGN KEY (estudiante_id) REFERENCES public.estudiante(id);


--
-- TOC entry 5109 (class 2606 OID 16971)
-- Name: asistencia asistencia_registrado_por_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asistencia
    ADD CONSTRAINT asistencia_registrado_por_id_fkey FOREIGN KEY (registrado_por_id) REFERENCES public.usuario(id);


--
-- TOC entry 5092 (class 2606 OID 16823)
-- Name: aula aula_grado_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.aula
    ADD CONSTRAINT aula_grado_id_fkey FOREIGN KEY (grado_id) REFERENCES public.grado(id);


--
-- TOC entry 5093 (class 2606 OID 16828)
-- Name: aula aula_seccion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.aula
    ADD CONSTRAINT aula_seccion_id_fkey FOREIGN KEY (seccion_id) REFERENCES public.seccion(id);


--
-- TOC entry 5114 (class 2606 OID 17112)
-- Name: calificacion_bimestral calificacion_bimestral_competencia_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calificacion_bimestral
    ADD CONSTRAINT calificacion_bimestral_competencia_id_fkey FOREIGN KEY (competencia_id) REFERENCES public.competencia(id);


--
-- TOC entry 5115 (class 2606 OID 17122)
-- Name: calificacion_bimestral calificacion_bimestral_escala_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calificacion_bimestral
    ADD CONSTRAINT calificacion_bimestral_escala_id_fkey FOREIGN KEY (escala_id) REFERENCES public.escala_calificacion(id);


--
-- TOC entry 5116 (class 2606 OID 17107)
-- Name: calificacion_bimestral calificacion_bimestral_estudiante_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calificacion_bimestral
    ADD CONSTRAINT calificacion_bimestral_estudiante_id_fkey FOREIGN KEY (estudiante_id) REFERENCES public.estudiante(id);


--
-- TOC entry 5117 (class 2606 OID 17117)
-- Name: calificacion_bimestral calificacion_bimestral_periodo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calificacion_bimestral
    ADD CONSTRAINT calificacion_bimestral_periodo_id_fkey FOREIGN KEY (periodo_id) REFERENCES public.periodo_academico(id);


--
-- TOC entry 5102 (class 2606 OID 16949)
-- Name: calificacion calificacion_competencia_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calificacion
    ADD CONSTRAINT calificacion_competencia_id_fkey FOREIGN KEY (competencia_id) REFERENCES public.competencia(id);


--
-- TOC entry 5103 (class 2606 OID 17087)
-- Name: calificacion calificacion_escala_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calificacion
    ADD CONSTRAINT calificacion_escala_id_fkey FOREIGN KEY (escala_id) REFERENCES public.escala_calificacion(id);


--
-- TOC entry 5104 (class 2606 OID 16934)
-- Name: calificacion calificacion_estudiante_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calificacion
    ADD CONSTRAINT calificacion_estudiante_id_fkey FOREIGN KEY (estudiante_id) REFERENCES public.estudiante(id);


--
-- TOC entry 5105 (class 2606 OID 17082)
-- Name: calificacion calificacion_semana_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calificacion
    ADD CONSTRAINT calificacion_semana_id_fkey FOREIGN KEY (semana_id) REFERENCES public.semana_academica(id);


--
-- TOC entry 5098 (class 2606 OID 16898)
-- Name: carga_academica carga_academica_aula_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carga_academica
    ADD CONSTRAINT carga_academica_aula_id_fkey FOREIGN KEY (aula_id) REFERENCES public.aula(id);


--
-- TOC entry 5099 (class 2606 OID 16893)
-- Name: carga_academica carga_academica_curso_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carga_academica
    ADD CONSTRAINT carga_academica_curso_id_fkey FOREIGN KEY (curso_id) REFERENCES public.curso(id);


--
-- TOC entry 5100 (class 2606 OID 16888)
-- Name: carga_academica carga_academica_docente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carga_academica
    ADD CONSTRAINT carga_academica_docente_id_fkey FOREIGN KEY (docente_id) REFERENCES public.usuario(id);


--
-- TOC entry 5089 (class 2606 OID 17029)
-- Name: competencia competencia_carga_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.competencia
    ADD CONSTRAINT competencia_carga_id_fkey FOREIGN KEY (carga_id) REFERENCES public.carga_academica(id);


--
-- TOC entry 5090 (class 2606 OID 16766)
-- Name: competencia competencia_curso_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.competencia
    ADD CONSTRAINT competencia_curso_id_fkey FOREIGN KEY (curso_id) REFERENCES public.curso(id);


--
-- TOC entry 5094 (class 2606 OID 16848)
-- Name: estudiante estudiante_aula_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.estudiante
    ADD CONSTRAINT estudiante_aula_id_fkey FOREIGN KEY (aula_id) REFERENCES public.aula(id);


--
-- TOC entry 5095 (class 2606 OID 16853)
-- Name: estudiante estudiante_padre_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.estudiante
    ADD CONSTRAINT estudiante_padre_id_fkey FOREIGN KEY (padre_id) REFERENCES public.usuario(id);


--
-- TOC entry 5101 (class 2606 OID 16916)
-- Name: horario_detalle horario_detalle_carga_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.horario_detalle
    ADD CONSTRAINT horario_detalle_carga_id_fkey FOREIGN KEY (carga_id) REFERENCES public.carga_academica(id);


--
-- TOC entry 5110 (class 2606 OID 16999)
-- Name: incidencia incidencia_estudiante_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incidencia
    ADD CONSTRAINT incidencia_estudiante_id_fkey FOREIGN KEY (estudiante_id) REFERENCES public.estudiante(id);


--
-- TOC entry 5111 (class 2606 OID 17004)
-- Name: incidencia incidencia_registrado_por_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incidencia
    ADD CONSTRAINT incidencia_registrado_por_id_fkey FOREIGN KEY (registrado_por_id) REFERENCES public.usuario(id);


--
-- TOC entry 5113 (class 2606 OID 17056)
-- Name: semana_academica semana_academica_periodo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.semana_academica
    ADD CONSTRAINT semana_academica_periodo_id_fkey FOREIGN KEY (periodo_id) REFERENCES public.periodo_academico(id);


--
-- TOC entry 5091 (class 2606 OID 16805)
-- Name: usuario usuario_rol_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_rol_id_fkey FOREIGN KEY (rol_id) REFERENCES public.rol(id);

-- Relación de tutoría en aulas
ALTER TABLE ONLY public.aula
    ADD CONSTRAINT aula_tutor_id_fkey FOREIGN KEY (tutor_id) REFERENCES public.usuario(id) ON DELETE SET NULL;


-- Completed on 2026-05-11 21:32:30

--
-- PostgreSQL database dump complete
--

\unrestrict UGh3Tq2axZjBp0MTEDDLUheYynHiVmHnskDnqhGeXFWldZyHNluLofnNgtJsz8E

