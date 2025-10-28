--
-- PostgreSQL database dump
--

-- Dumped from database version 16.0
-- Dumped by pg_dump version 16.0

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: analiza; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.analiza (
    id integer NOT NULL,
    user_id integer NOT NULL,
    subject character varying(255) NOT NULL,
    message text NOT NULL,
    created timestamp without time zone DEFAULT now()
);


ALTER TABLE public.analiza OWNER TO postgres;

--
-- Name: analiza_skup; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.analiza_skup (
    analiza_id integer NOT NULL,
    skup_id uuid NOT NULL
);


ALTER TABLE public.analiza_skup OWNER TO postgres;

--
-- Name: procjena; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.procjena (
    id integer NOT NULL,
    analiza_id integer NOT NULL,
    message text NOT NULL,
    created timestamp without time zone DEFAULT now()
);


ALTER TABLE public.procjena OWNER TO postgres;

--
-- Name: procjena_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.procjena_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.procjena_id_seq OWNER TO postgres;

--
-- Name: procjena_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.procjena_id_seq OWNED BY public.procjena.id;


--
-- Name: skup; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.skup (
    id uuid NOT NULL,
    url character varying(255) NOT NULL,
    name character varying(255) NOT NULL
);


ALTER TABLE public.skup OWNER TO postgres;

--
-- Name: slika; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.slika (
    id integer NOT NULL,
    analiza_id integer NOT NULL,
    content_hash character varying(255) NOT NULL,
    original_name character varying(255),
    mime_type character varying(30),
    created timestamp without time zone DEFAULT now()
);


ALTER TABLE public.slika OWNER TO postgres;

--
-- Name: slika_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.slika_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.slika_id_seq OWNER TO postgres;

--
-- Name: slika_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.slika_id_seq OWNED BY public.slika.id;


--
-- Name: procjena id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.procjena ALTER COLUMN id SET DEFAULT nextval('public.procjena_id_seq'::regclass);


--
-- Name: slika id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.slika ALTER COLUMN id SET DEFAULT nextval('public.slika_id_seq'::regclass);


--
-- Name: analiza analiza_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.analiza
    ADD CONSTRAINT analiza_pkey PRIMARY KEY (id);


--
-- Name: analiza_skup analiza_skup_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.analiza_skup
    ADD CONSTRAINT analiza_skup_pkey PRIMARY KEY (analiza_id, skup_id);


--
-- Name: procjena procjena_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.procjena
    ADD CONSTRAINT procjena_pkey PRIMARY KEY (id);


--
-- Name: skup skup_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.skup
    ADD CONSTRAINT skup_pkey PRIMARY KEY (id);


--
-- Name: skup skup_url_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.skup
    ADD CONSTRAINT skup_url_key UNIQUE (url);


--
-- Name: slika slika_content_hash_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.slika
    ADD CONSTRAINT slika_content_hash_key UNIQUE (content_hash);


--
-- Name: slika slika_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.slika
    ADD CONSTRAINT slika_pkey PRIMARY KEY (id);


--
-- Name: analiza_skup analiza_skup_analiza_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.analiza_skup
    ADD CONSTRAINT analiza_skup_analiza_id_fkey FOREIGN KEY (analiza_id) REFERENCES public.analiza(id) ON DELETE CASCADE;


--
-- Name: analiza_skup analiza_skup_skup_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.analiza_skup
    ADD CONSTRAINT analiza_skup_skup_id_fkey FOREIGN KEY (skup_id) REFERENCES public.skup(id) ON DELETE CASCADE;


--
-- Name: procjena procjena_analiza_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.procjena
    ADD CONSTRAINT procjena_analiza_id_fkey FOREIGN KEY (analiza_id) REFERENCES public.analiza(id) ON DELETE CASCADE;


--
-- Name: slika slika_analiza_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.slika
    ADD CONSTRAINT slika_analiza_id_fkey FOREIGN KEY (analiza_id) REFERENCES public.analiza(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

