--
-- PostgreSQL database dump
--

\restrict nceXFnxr9jHQFFJPWYcmp7TvCRQaj9sbiAz4IxGcdJggfwLdvUGmLW4tMSyHnS3

-- Dumped from database version 14.19
-- Dumped by pg_dump version 14.19

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

--
-- Name: NotificationType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."NotificationType" AS ENUM (
    'ORDER_CREATED',
    'ORDER_UPDATE',
    'PAYMENT_SUCCESS',
    'PAYMENT_FAILED',
    'PRODUCT_SOLD',
    'NEW_MESSAGE',
    'SYSTEM',
    'SUCCESS',
    'ERROR',
    'WARNING',
    'INFO'
);


ALTER TYPE public."NotificationType" OWNER TO postgres;

--
-- Name: OrderStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."OrderStatus" AS ENUM (
    'PENDING',
    'PROCESSING',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED'
);


ALTER TYPE public."OrderStatus" OWNER TO postgres;

--
-- Name: PaymentMethod; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PaymentMethod" AS ENUM (
    'CASH',
    'MOBILE_MONEY',
    'CARD'
);


ALTER TYPE public."PaymentMethod" OWNER TO postgres;

--
-- Name: PaymentStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PaymentStatus" AS ENUM (
    'PENDING',
    'PAID',
    'FAILED'
);


ALTER TYPE public."PaymentStatus" OWNER TO postgres;

--
-- Name: Role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."Role" AS ENUM (
    'BUYER',
    'SELLER',
    'ADMIN'
);


ALTER TYPE public."Role" OWNER TO postgres;

--
-- Name: UserStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."UserStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED',
    'SUSPENDED'
);


ALTER TYPE public."UserStatus" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Cart; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Cart" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Cart" OWNER TO postgres;

--
-- Name: CartItem; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."CartItem" (
    id text NOT NULL,
    "cartId" text NOT NULL,
    "productId" text NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."CartItem" OWNER TO postgres;

--
-- Name: Notification; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Notification" (
    id text NOT NULL,
    "userId" text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    type public."NotificationType" NOT NULL,
    "isRead" boolean DEFAULT false NOT NULL,
    "relatedId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Notification" OWNER TO postgres;

--
-- Name: Order; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Order" (
    id text NOT NULL,
    "orderNumber" text NOT NULL,
    "userId" text NOT NULL,
    "shippingAddress" jsonb NOT NULL,
    subtotal double precision NOT NULL,
    "shippingFee" double precision DEFAULT 0 NOT NULL,
    total double precision NOT NULL,
    status public."OrderStatus" DEFAULT 'PENDING'::public."OrderStatus" NOT NULL,
    "paymentMethod" public."PaymentMethod" NOT NULL,
    "paymentStatus" public."PaymentStatus" DEFAULT 'PENDING'::public."PaymentStatus" NOT NULL,
    "transactionId" text,
    "shippingMethod" text,
    "trackingNumber" text,
    "shippedAt" timestamp(3) without time zone,
    "deliveredAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Order" OWNER TO postgres;

--
-- Name: OrderItem; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."OrderItem" (
    id text NOT NULL,
    "orderId" text NOT NULL,
    "productId" text NOT NULL,
    quantity integer NOT NULL,
    price double precision NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."OrderItem" OWNER TO postgres;

--
-- Name: Product; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Product" (
    id text NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    price double precision NOT NULL,
    stock integer NOT NULL,
    category text NOT NULL,
    images text[],
    "isActive" boolean DEFAULT true NOT NULL,
    attributes jsonb,
    weight double precision,
    dimensions jsonb,
    "shippingFee" double precision DEFAULT 0 NOT NULL,
    "sellerId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Product" OWNER TO postgres;

--
-- Name: Review; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Review" (
    id text NOT NULL,
    "productId" text NOT NULL,
    "userId" text NOT NULL,
    rating integer NOT NULL,
    comment text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Review" OWNER TO postgres;

--
-- Name: User; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."User" (
    id text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    "firstName" text NOT NULL,
    "lastName" text NOT NULL,
    phone text,
    role public."Role" DEFAULT 'BUYER'::public."Role" NOT NULL,
    "isVerified" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "approvedAt" timestamp(3) without time zone,
    "approvedBy" text,
    "rejectionReason" text,
    status public."UserStatus" DEFAULT 'PENDING'::public."UserStatus" NOT NULL
);


ALTER TABLE public."User" OWNER TO postgres;

--
-- Data for Name: Cart; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Cart" (id, "userId", "createdAt", "updatedAt") FROM stdin;
28ec8a9b-05b2-4c21-894b-8d236059d7c9	2fe9b2eb-e726-4e67-90c2-82ea8776f899	2025-11-09 10:02:58.417	2025-11-09 10:02:58.417
0b2e9a17-22af-4096-9105-d80f1fb408d7	13e43014-10cb-4209-b9b9-a869e63ea970	2025-11-09 10:02:58.425	2025-11-09 10:02:58.425
32ce76dc-ebdf-47f2-bb27-54bcf85631d4	acd3717d-45c8-4944-8b82-34a834928e70	2025-11-09 10:02:58.428	2025-11-09 10:02:58.428
965ceaa1-bd54-4656-a7c9-905b319d6fca	a70c6048-25c0-454c-9bf4-8df15c75c4fa	2025-11-09 10:02:58.433	2025-11-09 10:02:58.433
9e1e7d98-dbee-415d-a7b6-355fd75a116c	2412f17f-e935-402e-9cb2-e4a56802e163	2025-11-09 11:39:19.636	2025-11-09 11:39:19.636
\.


--
-- Data for Name: CartItem; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."CartItem" (id, "cartId", "productId", quantity, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Notification; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Notification" (id, "userId", title, message, type, "isRead", "relatedId", "createdAt", "updatedAt") FROM stdin;
642974a5-5922-4fc1-9508-e4e5d2e3016b	acd3717d-45c8-4944-8b82-34a834928e70	Compte Approuvé	Votre compte a été approuvé. Vous pouvez maintenant vous connecter et utiliser toutes les fonctionnalités.	SUCCESS	f	\N	2025-11-09 10:08:33.26	2025-11-09 10:08:33.26
59a4d03d-af5a-4c78-ac20-3179cb55cbad	13e43014-10cb-4209-b9b9-a869e63ea970	Compte Refusé	Votre compte a été refusé. Raison: contrat echoué	ERROR	f	\N	2025-11-09 11:36:13.116	2025-11-09 11:36:13.116
ff0b3aa3-6d0d-4a01-9bf3-81b5ae5affd9	acd3717d-45c8-4944-8b82-34a834928e70	📦 Nouvelle commande	Nouvelle commande #ORD-1762694404072-AWQDVIYEL. Montant: 25 000 F	PRODUCT_SOLD	f	9181e744-fda6-4f6b-9132-f4e7527d7075	2025-11-09 13:20:04.597	2025-11-09 13:20:04.597
91be7dcc-8723-4442-9dd8-278a2da70035	13e43014-10cb-4209-b9b9-a869e63ea970	Compte Réactivé	Votre compte a été réactivé. Vous pouvez à nouveau vous connecter.	SUCCESS	f	\N	2025-11-09 14:26:27.527	2025-11-09 14:26:27.527
e3cd98eb-2242-4f41-bd76-e6018e1e21b4	13e43014-10cb-4209-b9b9-a869e63ea970	Compte Suspendu	Votre compte a été suspendu. Raison: dommage	WARNING	f	\N	2025-11-09 14:26:40.363	2025-11-09 14:26:40.363
28acdd62-319a-4012-b263-b14182dd643e	2412f17f-e935-402e-9cb2-e4a56802e163	Compte Approuvé	Votre compte a été approuvé. Vous pouvez maintenant vous connecter et utiliser toutes les fonctionnalités.	SUCCESS	f	\N	2025-11-09 19:56:45.721	2025-11-09 19:56:45.721
15a9059f-e85f-4ba5-8a75-6b23ce1ff39b	2fe9b2eb-e726-4e67-90c2-82ea8776f899	🎉 Commande créée	Votre commande #ORD-1762694404072-AWQDVIYEL a été créée avec succès. Montant: 25 000 F	ORDER_CREATED	t	9181e744-fda6-4f6b-9132-f4e7527d7075	2025-11-09 13:20:04.472	2025-11-10 08:52:26.349
\.


--
-- Data for Name: Order; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Order" (id, "orderNumber", "userId", "shippingAddress", subtotal, "shippingFee", total, status, "paymentMethod", "paymentStatus", "transactionId", "shippingMethod", "trackingNumber", "shippedAt", "deliveredAt", "createdAt", "updatedAt") FROM stdin;
9181e744-fda6-4f6b-9132-f4e7527d7075	ORD-1762694404072-AWQDVIYEL	2fe9b2eb-e726-4e67-90c2-82ea8776f899	{"city": "Abidjan", "email": "admin@test.com", "phone": "+2250703333333", "address": "Avenue delafosse", "commune": "Yopougon", "lastName": "System", "firstName": "Admin", "instructions": ""}	25000	0	25000	PENDING	CASH	PENDING	\N	\N	\N	\N	\N	2025-11-09 13:20:04.081	2025-11-09 13:20:04.081
\.


--
-- Data for Name: OrderItem; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."OrderItem" (id, "orderId", "productId", quantity, price, "createdAt", "updatedAt") FROM stdin;
71795e0b-78a6-4370-85b8-880f1855e680	9181e744-fda6-4f6b-9132-f4e7527d7075	176044c3-6068-4f54-a041-a674964d532e	1	25000	2025-11-09 13:20:04.081	2025-11-09 13:20:04.081
\.


--
-- Data for Name: Product; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Product" (id, name, description, price, stock, category, images, "isActive", attributes, weight, dimensions, "shippingFee", "sellerId", "createdAt", "updatedAt") FROM stdin;
428f269c-059c-4529-997a-f575d1cbeb0b	T-shirt Nike Sport	T-shirt de sport confortable et respirant	15000	50	CLOTHING	{https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500}	t	{"size": "L", "color": "Noir", "pattern": "Uni", "material": "Coton"}	0.3	{"width": 25, "height": 2, "length": 30}	1000	13e43014-10cb-4209-b9b9-a869e63ea970	2025-11-09 10:02:58.434	2025-11-09 10:02:58.434
3f1cdf48-1467-479f-9257-abb06145f7ac	Jean Levi's 501	Jean classique coupe droite	35000	40	CLOTHING	{https://images.unsplash.com/photo-1542272604-787c3835535d?w=500}	t	{"size": "M", "color": "Bleu", "pattern": "Uni", "material": "Jean"}	0.6	\N	1000	13e43014-10cb-4209-b9b9-a869e63ea970	2025-11-09 10:02:58.44	2025-11-09 10:02:58.44
b6fe87f1-fe03-4a9e-9c9c-467a7d8904c5	Sneakers Adidas Original	Chaussures de sport légères et confortables	45000	30	SHOES	{https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500}	t	{"size": "42", "type": "Sneakers", "color": "Blanc", "material": "Cuir synthétique"}	0.8	\N	1000	13e43014-10cb-4209-b9b9-a869e63ea970	2025-11-09 10:02:58.443	2025-11-09 10:02:58.443
692592b4-4eb6-4bb8-9fe3-af9dbfaaf0ba	Baskets Nike Air Max	Baskets avec technologie Air visible	65000	25	SHOES	{https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500}	t	{"size": "41", "type": "Baskets", "color": "Noir", "material": "Cuir"}	0.9	\N	1000	acd3717d-45c8-4944-8b82-34a834928e70	2025-11-09 10:02:58.445	2025-11-09 10:02:58.445
68b44dde-efbd-473f-b10d-023ecc1a5312	Sac à main Cuir	Élégant sac à main en cuir véritable	45000	15	BAGS	{https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500}	t	{"type": "Sac à main", "color": "Marron", "format": "Moyen", "material": "Cuir"}	0.7	\N	1000	acd3717d-45c8-4944-8b82-34a834928e70	2025-11-09 10:02:58.453	2025-11-09 10:02:58.453
c844413c-e19e-42ff-bf1d-703b953d9143	Bouteille Sport 1L	Bouteille réutilisable sans BPA	3500	100	CONTAINERS	{https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500}	t	{"color": "Bleu", "format": "Moyen", "capacity": "1L", "material": "Plastique"}	0.2	\N	1000	13e43014-10cb-4209-b9b9-a869e63ea970	2025-11-09 10:02:58.455	2025-11-09 10:02:58.455
ecca3ff4-2d41-4869-9a26-d22e729c3e15	Boîte Hermétique 2L	Boîte de conservation alimentaire	5000	80	CONTAINERS	{https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=500}	t	{"color": "Transparent", "format": "Grand", "capacity": "2L", "material": "Plastique"}	0.3	\N	1000	13e43014-10cb-4209-b9b9-a869e63ea970	2025-11-09 10:02:58.457	2025-11-09 10:02:58.457
f2df1e0e-473d-4037-9b67-fb2d463e561f	Montre Casio G-Shock	Montre digitale résistante aux chocs	55000	15	ACCESSORIES	{https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500}	t	{"type": "Montre", "color": "Noir", "material": "Plastique"}	0.15	\N	1000	acd3717d-45c8-4944-8b82-34a834928e70	2025-11-09 10:02:58.46	2025-11-09 10:02:58.46
93c79618-1527-46d8-b164-4d649c731362	Lunettes de Soleil Ray-Ban	Lunettes de soleil classiques	35000	25	ACCESSORIES	{https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=500}	t	{"type": "Lunettes", "color": "Noir", "material": "Plastique"}	0.1	\N	1000	acd3717d-45c8-4944-8b82-34a834928e70	2025-11-09 10:02:58.464	2025-11-09 10:02:58.464
176044c3-6068-4f54-a041-a674964d532e	Sac à dos Eastpak	Sac à dos spacieux avec plusieurs compartiments	25000	19	BAGS	{https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500}	t	{"type": "Sac à dos", "color": "Noir", "format": "Grand", "material": "Nylon"}	0.5	\N	1000	acd3717d-45c8-4944-8b82-34a834928e70	2025-11-09 10:02:58.45	2025-11-09 13:20:04.119
\.


--
-- Data for Name: Review; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Review" (id, "productId", "userId", rating, comment, "createdAt", "updatedAt") FROM stdin;
93304730-a329-4340-9c0e-4c7ace489fbd	428f269c-059c-4529-997a-f575d1cbeb0b	a70c6048-25c0-454c-9bf4-8df15c75c4fa	5	Excellent produit ! Très satisfait.	2025-11-09 10:02:58.466	2025-11-09 10:02:58.466
c2dbb102-3060-4105-ba51-292b27b82302	b6fe87f1-fe03-4a9e-9c9c-467a7d8904c5	a70c6048-25c0-454c-9bf4-8df15c75c4fa	4	Très confortable, je recommande.	2025-11-09 10:02:58.469	2025-11-09 10:02:58.469
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."User" (id, email, password, "firstName", "lastName", phone, role, "isVerified", "createdAt", "updatedAt", "approvedAt", "approvedBy", "rejectionReason", status) FROM stdin;
a70c6048-25c0-454c-9bf4-8df15c75c4fa	acheteur@test.com	$2a$10$PtqFjlweEf3cf6kLYctVzOOBDT17th01zXNOu/DRTXSE0euJKSJTG	Jean	Acheteur	+2250702222222	BUYER	t	2025-11-09 10:02:58.431	2025-11-09 10:02:58.431	2025-11-09 10:02:58.428	2fe9b2eb-e726-4e67-90c2-82ea8776f899	\N	APPROVED
acd3717d-45c8-4944-8b82-34a834928e70	vendeur2@test.com	$2a$10$PtqFjlweEf3cf6kLYctVzOOBDT17th01zXNOu/DRTXSE0euJKSJTG	Marie	Commerce	+2250701111111	SELLER	f	2025-11-09 10:02:58.424	2025-11-09 10:08:33.247	2025-11-09 10:08:33.243	2fe9b2eb-e726-4e67-90c2-82ea8776f899	\N	APPROVED
13e43014-10cb-4209-b9b9-a869e63ea970	vendeur@test.com	$2a$10$PtqFjlweEf3cf6kLYctVzOOBDT17th01zXNOu/DRTXSE0euJKSJTG	Koffi	Vendeur	+2250700000000	SELLER	f	2025-11-09 10:02:58.421	2025-11-09 14:26:40.352	\N	\N	dommage	SUSPENDED
2412f17f-e935-402e-9cb2-e4a56802e163	jackgaranet12@gmal.com	$2a$12$cTRapUmxV7ZtrZNQvkEEdep/DH6T3sCf8NXeReM9jV9rQ9.cKBLHu	jack	garanet	0112041222	BUYER	f	2025-11-09 11:39:19.628	2025-11-09 19:56:45.674	2025-11-09 19:56:45.66	2fe9b2eb-e726-4e67-90c2-82ea8776f899	\N	APPROVED
2fe9b2eb-e726-4e67-90c2-82ea8776f899	admin@test.com	$2a$10$PtqFjlweEf3cf6kLYctVzOOBDT17th01zXNOu/DRTXSE0euJKSJTG	Admin	System	+2250703333333	ADMIN	t	2025-11-09 10:02:58.412	2025-11-10 08:53:22.308	2025-11-09 10:02:58.409	\N	\N	APPROVED
\.


--
-- Name: CartItem CartItem_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CartItem"
    ADD CONSTRAINT "CartItem_pkey" PRIMARY KEY (id);


--
-- Name: Cart Cart_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Cart"
    ADD CONSTRAINT "Cart_pkey" PRIMARY KEY (id);


--
-- Name: Notification Notification_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_pkey" PRIMARY KEY (id);


--
-- Name: OrderItem OrderItem_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_pkey" PRIMARY KEY (id);


--
-- Name: Order Order_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_pkey" PRIMARY KEY (id);


--
-- Name: Product Product_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_pkey" PRIMARY KEY (id);


--
-- Name: Review Review_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Review"
    ADD CONSTRAINT "Review_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: CartItem_cartId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "CartItem_cartId_idx" ON public."CartItem" USING btree ("cartId");


--
-- Name: CartItem_cartId_productId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "CartItem_cartId_productId_key" ON public."CartItem" USING btree ("cartId", "productId");


--
-- Name: CartItem_productId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "CartItem_productId_idx" ON public."CartItem" USING btree ("productId");


--
-- Name: Cart_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Cart_userId_key" ON public."Cart" USING btree ("userId");


--
-- Name: Notification_isRead_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Notification_isRead_idx" ON public."Notification" USING btree ("isRead");


--
-- Name: Notification_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Notification_userId_idx" ON public."Notification" USING btree ("userId");


--
-- Name: OrderItem_orderId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "OrderItem_orderId_idx" ON public."OrderItem" USING btree ("orderId");


--
-- Name: OrderItem_productId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "OrderItem_productId_idx" ON public."OrderItem" USING btree ("productId");


--
-- Name: Order_orderNumber_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Order_orderNumber_idx" ON public."Order" USING btree ("orderNumber");


--
-- Name: Order_orderNumber_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Order_orderNumber_key" ON public."Order" USING btree ("orderNumber");


--
-- Name: Order_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Order_status_idx" ON public."Order" USING btree (status);


--
-- Name: Order_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Order_userId_idx" ON public."Order" USING btree ("userId");


--
-- Name: Product_category_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Product_category_idx" ON public."Product" USING btree (category);


--
-- Name: Product_isActive_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Product_isActive_idx" ON public."Product" USING btree ("isActive");


--
-- Name: Product_sellerId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Product_sellerId_idx" ON public."Product" USING btree ("sellerId");


--
-- Name: Review_productId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Review_productId_idx" ON public."Review" USING btree ("productId");


--
-- Name: Review_productId_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Review_productId_userId_key" ON public."Review" USING btree ("productId", "userId");


--
-- Name: Review_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Review_userId_idx" ON public."Review" USING btree ("userId");


--
-- Name: User_email_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "User_email_idx" ON public."User" USING btree (email);


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: User_role_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "User_role_idx" ON public."User" USING btree (role);


--
-- Name: User_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "User_status_idx" ON public."User" USING btree (status);


--
-- Name: CartItem CartItem_cartId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CartItem"
    ADD CONSTRAINT "CartItem_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES public."Cart"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CartItem CartItem_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CartItem"
    ADD CONSTRAINT "CartItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Cart Cart_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Cart"
    ADD CONSTRAINT "Cart_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Notification Notification_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: OrderItem OrderItem_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: OrderItem OrderItem_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Order Order_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Product Product_sellerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Review Review_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Review"
    ADD CONSTRAINT "Review_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Review Review_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Review"
    ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: User User_approvedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict nceXFnxr9jHQFFJPWYcmp7TvCRQaj9sbiAz4IxGcdJggfwLdvUGmLW4tMSyHnS3

