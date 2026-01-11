--
-- PostgreSQL database dump
--

\restrict wmCazalyvisZrJAn56YK2ZxzNCb9WSWiIdZ0rjJa3mvfkfcqlQfvYdssay7EQ9o

-- Dumped from database version 17.7 (Debian 17.7-3.pgdg12+1)
-- Dumped by pg_dump version 17.7

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
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: izdavac; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.izdavac (
    id text NOT NULL,
    publisher text,
    description text
);


--
-- Name: komentar; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.komentar (
    id bigint NOT NULL,
    user_id bigint,
    skup_id text,
    created timestamp without time zone,
    subject text,
    message text,
    import_id bigint,
    import_source text NOT NULL
);


--
-- Name: komentar_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.komentar_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: komentar_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.komentar_id_seq OWNED BY public.komentar.id;


--
-- Name: komentar_import_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.komentar_import_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: odgovor; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.odgovor (
    id integer NOT NULL,
    komentar_id bigint,
    created timestamp without time zone,
    message jsonb,
    score double precision
);


--
-- Name: odgovor_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.odgovor_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: odgovor_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.odgovor_id_seq OWNED BY public.odgovor.id;


--
-- Name: resurs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.resurs (
    id text NOT NULL,
    skup_id text,
    available_through_api boolean,
    name text,
    description text,
    created timestamp without time zone,
    last_modified timestamp without time zone,
    format text,
    mimetype text,
    state text,
    size integer,
    url text
);


--
-- Name: skup_podataka; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.skup_podataka (
    id text NOT NULL,
    title text,
    refresh_frequency text,
    theme text,
    description text,
    url text,
    state text,
    created timestamp without time zone,
    modified timestamp without time zone,
    isopen boolean,
    access_rights text,
    license_title text,
    license_url text,
    license_id text,
    publisher_id text,
    tags jsonb,
    fetched_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: slika; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.slika (
    komentar_id bigint NOT NULL,
    content_hash text NOT NULL,
    original_name text,
    mime_type text,
    created timestamp without time zone
);


--
-- Name: komentar id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.komentar ALTER COLUMN id SET DEFAULT nextval('public.komentar_id_seq'::regclass);


--
-- Name: odgovor id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.odgovor ALTER COLUMN id SET DEFAULT nextval('public.odgovor_id_seq'::regclass);


--
-- Name: izdavac izdavac_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.izdavac
    ADD CONSTRAINT izdavac_pkey PRIMARY KEY (id);


--
-- Name: komentar komentar_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.komentar
    ADD CONSTRAINT komentar_pkey PRIMARY KEY (id);


--
-- Name: odgovor odgovor_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.odgovor
    ADD CONSTRAINT odgovor_pkey PRIMARY KEY (id);


--
-- Name: resurs resurs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resurs
    ADD CONSTRAINT resurs_pkey PRIMARY KEY (id);


--
-- Name: skup_podataka skup_podataka_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skup_podataka
    ADD CONSTRAINT skup_podataka_pkey PRIMARY KEY (id);


--
-- Name: slika slika_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.slika
    ADD CONSTRAINT slika_pkey PRIMARY KEY (komentar_id, content_hash);


--
-- Name: komentar unique_alternative_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.komentar
    ADD CONSTRAINT unique_alternative_key UNIQUE (import_id);


--
-- Name: idx_skup_tags; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_skup_tags ON public.skup_podataka USING gin (tags);


--
-- Name: komentar_import_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX komentar_import_unique ON public.komentar USING btree (import_source, import_id) WHERE (import_id IS NOT NULL);


--
-- Name: komentar komentar_skup_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.komentar
    ADD CONSTRAINT komentar_skup_id_fkey FOREIGN KEY (skup_id) REFERENCES public.skup_podataka(id);


--
-- Name: odgovor odgovor_komentar_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.odgovor
    ADD CONSTRAINT odgovor_komentar_id_fkey FOREIGN KEY (komentar_id) REFERENCES public.komentar(id) ON DELETE CASCADE;


--
-- Name: resurs resurs_skup_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resurs
    ADD CONSTRAINT resurs_skup_id_fkey FOREIGN KEY (skup_id) REFERENCES public.skup_podataka(id) ON DELETE CASCADE;


--
-- Name: skup_podataka skup_podataka_publisher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skup_podataka
    ADD CONSTRAINT skup_podataka_publisher_id_fkey FOREIGN KEY (publisher_id) REFERENCES public.izdavac(id);


--
-- Name: slika slika_komentar_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.slika
    ADD CONSTRAINT slika_komentar_id_fkey FOREIGN KEY (komentar_id) REFERENCES public.komentar(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict wmCazalyvisZrJAn56YK2ZxzNCb9WSWiIdZ0rjJa3mvfkfcqlQfvYdssay7EQ9o

