-- =============================================================
-- VicFix — Seed de datos ficticios para screenshots del README
-- Base de datos: vicfixdb_dev (Docker local)
-- Todo es inventado: marcas, productos, plataformas, categorías.
-- Contraseña demo para todos los usuarios: demo1234
-- =============================================================
-- Correr DESPUÉS de que Spring Boot aplique las migraciones Flyway.
-- Uso:
--   docker exec -i vicfixdb_dev psql -U vicfix -d vicfixdb_dev < db/seed-demo.sql
-- =============================================================

\set ON_ERROR_STOP on

-- -------------------------------------------------------
-- 0. Limpiar todo (en orden inverso de dependencias)
-- -------------------------------------------------------
TRUNCATE TABLE
  refresh_tokens,
  password_reset_tokens,
  user_roles,
  role_permissions,
  permissions,
  roles,
  product_sales,
  product_stock_logs,
  product_price_histories,
  category_balances,
  notifications,
  supplies,
  supplier_categories,
  supplier_mails,
  supplier_phones,
  suppliers,
  reports,
  filter_reports,
  expenses,
  sales,
  platform_transactions,
  efecty_daily_close,
  platforms,
  products,
  categories,
  users
CASCADE;

-- Reiniciar secuencias
ALTER SEQUENCE category_category_id_seq RESTART WITH 1;
ALTER SEQUENCE product_product_id_seq RESTART WITH 1;
ALTER SEQUENCE user_id_seq RESTART WITH 1;
ALTER SEQUENCE role_id_seq RESTART WITH 1;
ALTER SEQUENCE permission_id_seq RESTART WITH 1;
ALTER SEQUENCE sale_sale_id_seq RESTART WITH 1;
ALTER SEQUENCE product_sale_product_sale_id_seq RESTART WITH 1;
ALTER SEQUENCE product_stock_log_product_stock_log_id_seq RESTART WITH 1;
ALTER SEQUENCE category_balance_balance_id_seq RESTART WITH 1;
ALTER SEQUENCE notifications_id_seq RESTART WITH 1;
ALTER SEQUENCE supplier_supplier_id_seq RESTART WITH 1;
ALTER SEQUENCE supply_supply_id_seq RESTART WITH 1;

-- -------------------------------------------------------
-- 1. Categorías (100% ficticias)
-- -------------------------------------------------------
INSERT INTO categories (category_id, category_name, code, is_active, register_date, update_date) VALUES
  (1, 'ARTÍCULOS ESENCIALES',   'ART001', true, NOW(), NOW()),
  (2, 'HELADOS ZAFIRO',         'HEL002', true, NOW(), NOW()),
  (3, 'SERVICIOS RAPIDOS',      'SRV003', true, NOW(), NOW());

SELECT setval('category_category_id_seq', 20);

-- -------------------------------------------------------
-- 2. Permisos y Roles
-- -------------------------------------------------------
INSERT INTO permissions (id, name) VALUES
  (1,  'CONFIGURATION_PERMISSION'),
  (2,  'USER_PERMISSION'),
  (3,  'CATEGORY_PERMISSION'),
  (4,  'PRODUCTS_PERMISSION'),
  (5,  'SUPPLIERS_PERMISSION'),
  (6,  'SALES_PERMISSION'),
  (7,  'REPORTS_PERMISSION'),
  (8,  'PRODUCT_SALES_PERMISSION'),
  (9,  'SUPPLIES_PERMISSION'),
  (10, 'STOCK_LOG_PERMISSION'),
  (11, 'PLATFORM_PERMISSION'),
  (12, 'NOTIFICATION_PERMISSION');

SELECT setval('permission_id_seq', 20);

INSERT INTO roles (id, name) VALUES
  (1, 'ROLE_USER'),
  (2, 'ROLE_ROOT'),
  (3, 'ROLE_ADMIN');

SELECT setval('role_id_seq', 10);

-- Todos los roles tienen todos los permisos
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p;

-- -------------------------------------------------------
-- 3. Usuarios ficticios
-- Contraseña: demo1234
-- Hash BCrypt generado con Spring Security strength=10
-- -------------------------------------------------------
INSERT INTO users (id, username, name, lastname, mail, phone, password, active, temporary, failed_attempts) VALUES
  (1, 'adminzafiro',  'Valentina', 'Ríos',     'valentina@demo.zafiro.co',  '3001112233', '$2b$10$nWdzPc3B06IThoHcS63IbuEvjczCC7BhBTNPw1aCxCV7Nb1vAzFGC', true,  false, 0),
  (2, 'caja01',       'Sebastián', 'Mora',      'sebastian@demo.zafiro.co',  '3002223344', '$2b$10$nWdzPc3B06IThoHcS63IbuEvjczCC7BhBTNPw1aCxCV7Nb1vAzFGC', true,  false, 0),
  (3, 'caja02',       'Daniela',   'Peña',      'daniela@demo.zafiro.co',    '3003334455', '$2b$10$nWdzPc3B06IThoHcS63IbuEvjczCC7BhBTNPw1aCxCV7Nb1vAzFGC', true,  false, 0),
  (4, 'supervisora',  'Camilo',    'Quiroga',   'camilo@demo.zafiro.co',     '3004445566', '$2b$10$nWdzPc3B06IThoHcS63IbuEvjczCC7BhBTNPw1aCxCV7Nb1vAzFGC', true,  false, 0),
  (5, 'caja03',       'Natalia',   'Fuentes',   'natalia@demo.zafiro.co',    NULL,         '$2b$10$nWdzPc3B06IThoHcS63IbuEvjczCC7BhBTNPw1aCxCV7Nb1vAzFGC', false, false, 0);

SELECT setval('user_id_seq', 10);

INSERT INTO user_roles (user_id, role_id) VALUES
  (1, 2), (1, 3),  -- adminzafiro: ROOT + ADMIN
  (2, 1),          -- caja01: USER
  (3, 1),          -- caja02: USER
  (4, 3),          -- supervisora: ADMIN
  (5, 1);          -- caja03: USER (inactiva)

-- -------------------------------------------------------
-- 4. Productos ficticios (marcas y nombres inventados)
-- -------------------------------------------------------
INSERT INTO products (product_id, product_name, brand, product_category_id, sale_price, cost_price, stock, reorder_quantity, measure_unit, status, is_service, register_date, update_date) VALUES
-- ARTÍCULOS ESENCIALES - escritorio/papelería ficticia
  (1,  'CUADERNO LISO 80H',           'KRONOS',   1, 2400,  1100, 52, 10, 'UNIT', 'ACTIVE', false, NOW(), NOW()),
  (2,  'CUADERNO RAYADO 50H',         'KRONOS',   1, 1700,   850, 41, 10, 'UNIT', 'ACTIVE', false, NOW(), NOW()),
  (3,  'BOLÍGRAFO PUNTA FINA NEGRO',  'VELOX',    1,  600,   220, 135, 10, 'UNIT', 'ACTIVE', false, NOW(), NOW()),
  (4,  'BOLÍGRAFO PUNTA FINA ROJO',   'VELOX',    1,  600,   220,  90, 10, 'UNIT', 'ACTIVE', false, NOW(), NOW()),
  (5,  'CRAYONES X12 SURTIDOS',       'LUMIKA',   1, 4200,  2600,  25, 10, 'UNIT', 'ACTIVE', false, NOW(), NOW()),
  (6,  'MARCADOR FLUORESCENTE VERDE', 'NEONIX',   1, 1400,   750,  18, 10, 'UNIT', 'ACTIVE', false, NOW(), NOW()),
  (7,  'RESMA PAPEL BLANCO X500',     'PAPERCOT', 1,17500, 13000,   3,  5, 'PACK', 'ACTIVE', false, NOW(), NOW()),
  (8,  'LÁPIZ GRAFITO X10',           'GRAFEX',   1, 3800,  2100,  27, 10, 'BOX',         'ACTIVE', false, NOW(), NOW()),
-- ARTÍCULOS ESENCIALES - higiene ficticia
  (9,  'SHAMPOO REVIVE 350ML',        'REVIVE',   1, 8800,  5100,   9,  5, 'UNIT', 'ACTIVE', false, NOW(), NOW()),
  (10, 'ACONDICIONADOR REVIVE 350ML', 'REVIVE',   1, 9200,  5900,   6,  5, 'UNIT', 'ACTIVE', false, NOW(), NOW()),
  (11, 'JABÓN EN BARRA PUROTEK X3',   'PUROTEK',  1, 7200,  4300,  14,  5, 'PACK',      'ACTIVE', false, NOW(), NOW()),
  (12, 'TOALLAS NOCTURNAS SOFTEL X8', 'SOFTEL',   1, 5800,  3400,  20, 10, 'PACK',      'ACTIVE', false, NOW(), NOW()),
  (13, 'PAÑAL BEBÉ SUAVECARE X20',    'SUAVECARE',1,39000, 29500,   4,  5, 'PACK', 'ACTIVE', false, NOW(), NOW()),
-- ARTÍCULOS ESENCIALES - bebidas y snacks ficticios
  (14, 'REFRESCO TROPICAL FRUTA 400ML','FRUTEX',  1, 1900,  1100,  28, 10, 'UNIT', 'ACTIVE', false, NOW(), NOW()),
  (15, 'AGUA PURIFICADA AQUAVIT 600ML','AQUAVIT', 1, 1400,   750,  40, 10, 'UNIT', 'ACTIVE', false, NOW(), NOW()),
  (16, 'GALLETA RELLENA DULCEX X4',   'DULCEX',   1, 1600,   850,  55, 10, 'PACK',      'ACTIVE', false, NOW(), NOW()),
  (17, 'GOMITAS MIXTAS DULCEX X30G',  'DULCEX',   1, 1100,   550,  70, 10, 'PACK', 'ACTIVE', false, NOW(), NOW()),
-- ARTÍCULOS ESENCIALES - medicamentos ficticios
  (18, 'TABLETA DOLOKAP 500MG X10',   'DOLOKAP',  1,  220,    90, 160, 10, 'PACK',      'ACTIVE', false, NOW(), NOW()),
  (19, 'TABLETA INFLATEK 400MG X10',  'INFLATEK', 1,  480,   170,  65, 10, 'PACK',      'ACTIVE', false, NOW(), NOW()),
  (20, 'SUERO REHIDRAL 500ML',        'REHIDRAL', 1, 5800,  3600,   5,  3, 'UNIT', 'ACTIVE', false, NOW(), NOW()),
-- ARTÍCULOS ESENCIALES - varios
  (21, 'VELA DECORATIVA GRANDE',       NULL,       1, 3200,  1800,  11,  5, 'UNIT', 'ACTIVE', false, NOW(), NOW()),
  (22, 'PILA DOBLE A POWERMAX X2',    'POWERMAX', 1, 4400,  2700,  16, 10, 'PACK',      'ACTIVE', false, NOW(), NOW()),
  (23, 'GLOBO METÁLICO SURTIDO',       NULL,       1,  600,   280,  88, 10, 'UNIT', 'ACTIVE', false, NOW(), NOW()),
-- SERVICIOS RÁPIDOS
  (24, 'IMPRESIÓN COLOR CARTA',        NULL,       3, 1000,   500, 999,  0, 'UNIT', 'ACTIVE', true,  NOW(), NOW()),
  (25, 'IMPRESIÓN B/N CARTA',          NULL,       3,  700,   350, 999,  0, 'UNIT', 'ACTIVE', true,  NOW(), NOW()),
  (26, 'COPIA B/N CARTA',              NULL,       3,  300,   150, 999,  0, 'UNIT', 'ACTIVE', true,  NOW(), NOW()),
  (27, 'COPIA COLOR CARTA',            NULL,       3,  800,   400, 999,  0, 'UNIT', 'ACTIVE', true,  NOW(), NOW()),
  (28, 'ESCANEO DOCUMENTO',            NULL,       3, 1000,   500, 999,  0, 'UNIT', 'ACTIVE', true,  NOW(), NOW()),
-- HELADOS ZAFIRO (receta artesanal ficticia)
  (29, 'HELADO ZAFIRO VAINILLA',       NULL,       2, 2000,  1000,  14,  5, 'UNIT', 'ACTIVE', false, NOW(), NOW()),
  (30, 'HELADO ZAFIRO MORA',           NULL,       2, 2000,  1000,   9,  5, 'UNIT', 'ACTIVE', false, NOW(), NOW()),
  (31, 'HELADO ZAFIRO CARAMELO',       NULL,       2, 2000,  1000,  11,  5, 'UNIT', 'ACTIVE', false, NOW(), NOW()),
  (32, 'HELADO ZAFIRO COCO',           NULL,       2, 2000,  1000,   7,  5, 'UNIT', 'ACTIVE', false, NOW(), NOW()),
  (33, 'HELADO ZAFIRO MARACUYÁ',       NULL,       2, 2000,  1000,   5,  3, 'UNIT', 'ACTIVE', false, NOW(), NOW());

SELECT setval('product_product_id_seq', 100);

-- -------------------------------------------------------
-- 5. Plataformas bancarias (nombres 100% ficticios)
-- -------------------------------------------------------
INSERT INTO platforms (id, name, code, color, tracks_transactions, tracks_profit, profit_in_balance, current_balance, minimum_threshold, last_updated, created_at) OVERRIDING SYSTEM VALUE VALUES
  (1, 'ZenPago',    'ZENPAGO',   '#F97316', true,  false, false,  310000,  100000, NOW(), NOW()),
  (2, 'CashGo',     'CASHGO',    '#EAB308', true,  false, false, 2350000,  700000, NOW(), NOW()),
  (3, 'Moviltek',   'MOVILTEK',  '#A855F7', true,  false, false,  165000,   50000, NOW(), NOW()),
  (4, 'BancaRed',   'BANCARED',  '#3B82F6', true,  false, false,  870000,  700000, NOW(), NOW()),
  (5, 'PagoPlus',   'PAGOPLUS',  '#EF4444', true,  false, false,   38000,  100000, NOW(), NOW()),
  (6, 'ExpressNet', 'EXPRESSNET','#10B981', true,  false, false,  420000,  150000, NOW(), NOW());

-- Cierre registrado ayer
INSERT INTO efecty_daily_close (close_date, closing_balance, notes, created_by) VALUES
  (CURRENT_DATE - 1, 2350000, 'Cierre sin novedades', 'adminzafiro');

-- Transacciones ficticias en plataformas
INSERT INTO platform_transactions (platform_id, transaction_date, operation, movement_type, amount, balance_before, balance_after, phone_number, created_by) VALUES
  (1, NOW() - INTERVAL '2 days', 'Recarga ZenPago',    'ENTRY', 180000, 130000, 310000,  '3001234567', 'caja01'),
  (2, NOW() - INTERVAL '1 day',  'Retiro CashGo',      'EXIT',  450000, 2800000, 2350000, NULL,        'caja01'),
  (3, NOW() - INTERVAL '3 hours','Retiro Moviltek',    'EXIT',  110000, 275000, 165000,  '3009876543', 'caja01'),
  (4, NOW() - INTERVAL '1 day',  'Recarga BancaRed',   'ENTRY', 470000, 400000, 870000,   NULL,        'adminzafiro'),
  (5, NOW() - INTERVAL '5 hours','Recarga PagoPlus',   'ENTRY',  38000, 0, 38000,         NULL,        'caja01'),
  (6, NOW() - INTERVAL '2 hours','Retiro ExpressNet',  'EXIT',  120000, 540000, 420000,  '3005556677', 'caja02');

-- -------------------------------------------------------
-- 6. Ventas ficticias (último mes)
-- -------------------------------------------------------
INSERT INTO sales (sale_id, sale_date, total, total_cost, profit, discount, payment_method, status, user_id) VALUES
  (1,  NOW() - INTERVAL '25 days', 3200,  1700, 1500, 0,    'CASH',  'COMPLETED', 2),
  (2,  NOW() - INTERVAL '24 days', 1500,   850,  650, 0,    'CASH',  'COMPLETED', 2),
  (3,  NOW() - INTERVAL '23 days', 4700,  2600, 2100, 0,    'NEQUI', 'COMPLETED', 2),
  (4,  NOW() - INTERVAL '22 days', 2000,  1000, 1000, 0,    'CASH',  'COMPLETED', 3),
  (5,  NOW() - INTERVAL '21 days', 8800,  5100, 3700, 0,    'CASH',  'COMPLETED', 2),
  (6,  NOW() - INTERVAL '20 days', 5600,  3400, 2200, 500,  'CASH',  'COMPLETED', 2),
  (7,  NOW() - INTERVAL '19 days', 4000,  2000, 2000, 0,    'NEQUI', 'COMPLETED', 3),
  (8,  NOW() - INTERVAL '18 days', 7200,  4300, 2900, 0,    'CASH',  'COMPLETED', 2),
  (9,  NOW() - INTERVAL '17 days', 4000,  2000, 2000, 0,    'CASH',  'COMPLETED', 2),
  (10, NOW() - INTERVAL '16 days', 4200,  2350, 1850, 0,    'CASH',  'COMPLETED', 3),
  (11, NOW() - INTERVAL '15 days', 9200,  5900, 3300, 0,    'CASH',  'COMPLETED', 2),
  (12, NOW() - INTERVAL '14 days', 6000,  3600, 2400, 0,    'NEQUI', 'COMPLETED', 2),
  (13, NOW() - INTERVAL '13 days', 2900,  1750, 1150, 0,    'CASH',  'COMPLETED', 2),
  (14, NOW() - INTERVAL '12 days', 4000,  2000, 2000, 0,    'CASH',  'COMPLETED', 3),
  (15, NOW() - INTERVAL '11 days', 7200,  4250, 2950, 0,    'CASH',  'COMPLETED', 2),
  (16, NOW() - INTERVAL '10 days', 3200,  1800, 1400, 0,    'CASH',  'COMPLETED', 2),
  (17, NOW() - INTERVAL '9 days',  5900,  3450, 2450, 0,    'NEQUI', 'COMPLETED', 2),
  (18, NOW() - INTERVAL '8 days',  2400,  1300,  900, 0,    'CASH',  'COMPLETED', 3),
  (19, NOW() - INTERVAL '7 days',  8000,  4000, 4000, 0,    'CASH',  'COMPLETED', 2),
  (20, NOW() - INTERVAL '6 days',  3100,  1800, 1300, 0,    'CASH',  'COMPLETED', 2),
  (21, NOW() - INTERVAL '5 days', 39000, 29500, 9500, 0,    'CASH',  'COMPLETED', 2),
  (22, NOW() - INTERVAL '4 days',  4800,  2900, 1900, 0,    'NEQUI', 'COMPLETED', 3),
  (23, NOW() - INTERVAL '3 days',  4700,  2900, 1800, 0,    'CASH',  'COMPLETED', 2),
  (24, NOW() - INTERVAL '2 days',  3800,  2120, 1680, 0,    'CASH',  'COMPLETED', 2),
  (25, NOW() - INTERVAL '1 day',   6000,  3850, 2150, 0,    'CASH',  'COMPLETED', 2);

SELECT setval('sale_sale_id_seq', 100);

-- Detalles de ventas
INSERT INTO product_sales (sale_id, product_id, quantity, price_per_unit, cost_price) VALUES
  -- Venta 1
  (1,  24, 2, 1000,  500),  -- Impresión color x2
  (1,  25, 2,  700,  350),  -- Impresión B/N x2
  -- Venta 2
  (2,  26, 5,  300,  150),  -- Copia B/N x5
  -- Venta 3
  (3,  29, 2, 2000, 1000),  -- Helado Vainilla x2
  (3,  30, 1, 2000, 1000),  -- Helado Mora x1
  (3,  25, 1,  700,  350),  -- Impresión B/N
  -- Venta 4
  (4,  29, 1, 2000, 1000),  -- Helado Vainilla
  (4,  30, 1, 2000, 1000),  -- Helado Mora
  -- Venta 5
  (5,   9, 1, 8800, 5100),  -- Shampoo Revive
  -- Venta 6
  (6,  10, 1, 9200, 5900),  -- Acondicionador Revive
  -- Venta 7
  (7,  31, 2, 2000, 1000),  -- Helado Caramelo x2
  -- Venta 8
  (8,  11, 1, 7200, 4300),  -- Jabón Purotek
  -- Venta 9
  (9,  32, 1, 2000, 1000),  -- Helado Coco
  (9,  33, 1, 2000, 1000),  -- Helado Maracuyá
  -- Venta 10
  (10,  1, 1, 2400, 1100),  -- Cuaderno Kronos
  (10, 24, 2, 1000,  500),  -- Impresión color x2
  (10, 25, 1,  700,  350),  -- Impresión B/N
  -- Venta 11
  (11, 10, 1, 9200, 5900),  -- Acondicionador Revive
  -- Venta 12
  (12, 24, 3, 1000,  500),  -- Impresión color x3
  (12, 25, 3,  700,  350),  -- Impresión B/N x3
  -- Venta 13
  (13, 16, 1, 1600,  850),  -- Galleta Dulcex
  (13, 14, 1, 1900, 1100),  -- Refresco Frutex
  -- Venta 14
  (14, 29, 2, 2000, 1000),  -- Helado Vainilla x2
  -- Venta 15
  (15, 18,10,  220,   90),  -- Tableta Dolokap x10
  (15, 25, 5,  700,  350),  -- Impresión B/N x5
  -- Venta 16
  (16, 21, 1, 3200, 1800),  -- Vela decorativa
  -- Venta 17
  (17, 24, 4, 1000,  500),  -- Impresión color x4
  (17, 26, 5,  300,  150),  -- Copia B/N x5
  (17, 27, 1,  800,  400),  -- Copia color
  -- Venta 18
  (18, 15, 2, 1400,  750),  -- Agua Aquavit x2
  (18, 16, 1, 1600,  850),  -- Galleta Dulcex
  -- Venta 19
  (19, 29, 2, 2000, 1000),  -- Helado Vainilla x2
  (19, 30, 2, 2000, 1000),  -- Helado Mora x2
  -- Venta 20
  (20, 25, 3,  700,  350),  -- Impresión B/N x3
  (20, 28, 2, 1000,  500),  -- Escaneo x2
  -- Venta 21
  (21, 13, 1,39000,29500),  -- Pañal Suavecare
  -- Venta 22
  (22, 24, 2, 1000,  500),  -- Impresión color x2
  (22, 29, 1, 2000, 1000),  -- Helado Vainilla
  (22, 31, 1, 2000, 1000),  -- Helado Caramelo
  -- Venta 23
  (23, 19, 2,  480,  170),  -- Tableta Inflatek x2
  (23, 18, 5,  220,   90),  -- Tableta Dolokap x5
  (23, 24, 3, 1000,  500),  -- Impresión color x3
  -- Venta 24
  (24,  1, 1, 2400, 1100),  -- Cuaderno Kronos
  (24,  3, 2,  600,  220),  -- Bolígrafo negro x2
  (24,  4, 1,  600,  220),  -- Bolígrafo rojo
  -- Venta 25
  (25, 24, 3, 1000,  500),  -- Impresión color x3
  (25, 30, 2, 2000, 1000),  -- Helado Mora x2
  (25, 32, 1, 2000, 1000);  -- Helado Coco

SELECT setval('product_sale_product_sale_id_seq', 200);

-- -------------------------------------------------------
-- 7. Balances por categoría
-- -------------------------------------------------------
INSERT INTO category_balances (category_id, date, total_sales, total_cost, total_profit, updated_at, updated_by) VALUES
  -- ARTÍCULOS ESENCIALES
  (1, CURRENT_DATE - 30, 48000,  29000, 19000, NOW(), 'system'),
  (1, CURRENT_DATE - 20, 71000,  43000, 28000, NOW(), 'system'),
  (1, CURRENT_DATE - 10, 54000,  33000, 21000, NOW(), 'system'),
  -- SERVICIOS RÁPIDOS
  (3, CURRENT_DATE - 30, 35000,  17500, 17500, NOW(), 'system'),
  (3, CURRENT_DATE - 20, 43000,  21500, 21500, NOW(), 'system'),
  (3, CURRENT_DATE - 10, 40000,  20000, 20000, NOW(), 'system'),
  -- HELADOS ZAFIRO
  (2, CURRENT_DATE - 30, 26000,  13000, 13000, NOW(), 'system'),
  (2, CURRENT_DATE - 20, 32000,  16000, 16000, NOW(), 'system'),
  (2, CURRENT_DATE - 10, 30000,  15000, 15000, NOW(), 'system');

-- -------------------------------------------------------
-- 8. Proveedores ficticios
-- -------------------------------------------------------
INSERT INTO suppliers (supplier_id, name, nit, business_type, description, status, website, register_date, update_date) VALUES
  (1, 'Distribuidora Kronos S.A.S',   '900123456-1', 'Distribuidora',  'Papelería y útiles escolares al por mayor',       'ACTIVE',   'www.kronos.co',    NOW(), NOW()),
  (2, 'Zafiro Artesanal Ltda',        '800234567-2', 'Fabricante',     'Producción artesanal de helados y postres fríos',  'ACTIVE',   NULL,               NOW(), NOW()),
  (3, 'Velox Suministros S.A.S',      '700345678-3', 'Distribuidora',  'Insumos para impresión y papelería de oficina',    'ACTIVE',   'www.velox.com.co', NOW(), NOW()),
  (4, 'Purotek Higiene Industrial',   '600456789-4', 'Importador',     'Productos de aseo e higiene personal',             'ACTIVE',   NULL,               NOW(), NOW()),
  (5, 'Frutex Bebidas S.A',           '500567890-5', 'Fabricante',     'Bebidas y refrescos naturales',                    'INACTIVE', NULL,               NOW(), NOW());

SELECT setval('supplier_supplier_id_seq', 20);

INSERT INTO supplier_phones (supplier_id, phone_number, type, register_date, update_date) VALUES
  (1, '3101112233', 'SALES',   NOW(), NOW()),
  (2, '3202223344', 'GENERAL', NOW(), NOW()),
  (3, '3153334455', 'SALES',   NOW(), NOW()),
  (4, '3004445566', 'SUPPORT', NOW(), NOW());

INSERT INTO supplier_mails (supplier_id, mail, type, is_active, register_date, update_date) VALUES
  (1, 'ventas@kronos.co',      'SALES',   true, NOW(), NOW()),
  (2, 'pedidos@zafiro.co',     'CONTACT', true, NOW(), NOW()),
  (3, 'comercial@velox.com.co','SALES',   true, NOW(), NOW()),
  (4, 'info@purotek.co',       'GENERAL', true, NOW(), NOW());

INSERT INTO supplier_categories (supplier_id, category_id, priority, is_active, assignment_date) VALUES
  (1, 1, 'HIGH',   true, CURRENT_DATE),
  (2, 2, 'HIGH',   true, CURRENT_DATE),
  (3, 3, 'MEDIUM', true, CURRENT_DATE),
  (4, 1, 'MEDIUM', true, CURRENT_DATE);

-- -------------------------------------------------------
-- 9. Suministros ficticios
-- -------------------------------------------------------
INSERT INTO supplies (supply_id, supplier_id, product_id, quantity, price_per_unit, status, supply_date, comments) VALUES
  (1,  1,  1,  50, 1100, 'DELIVERED', NOW() - INTERVAL '20 days', 'Pedido mensual de cuadernos'),
  (2,  1,  7,   5,13000, 'DELIVERED', NOW() - INTERVAL '15 days', 'Resmas para el mes'),
  (3,  1,  3, 100,  220, 'DELIVERED', NOW() - INTERVAL '10 days', NULL),
  (4,  2, 29,  30, 1000, 'DELIVERED', NOW() - INTERVAL '5 days',  'Helados vainilla temporada'),
  (5,  2, 30,  20, 1000, 'DELIVERED', NOW() - INTERVAL '5 days',  'Helados mora temporada'),
  (6,  3, 25, 999,  350, 'DELIVERED', NOW() - INTERVAL '8 days',  'Papel para impresora'),
  (7,  4,  9,  12, 5100, 'DELIVERED', NOW() - INTERVAL '12 days', NULL),
  (8,  4, 11,  20, 4300, 'DELIVERED', NOW() - INTERVAL '12 days', NULL),
  (9,  1,  8,  30, 2100, 'PENDING',   NOW() + INTERVAL '3 days',  'Pedido próxima semana'),
  (10, 2, 31,  15, 1000, 'PENDING',   NOW() + INTERVAL '2 days',  'Helados caramelo pedido nuevo');

SELECT setval('supply_supply_id_seq', 20);

-- -------------------------------------------------------
-- 10. Notificaciones de ejemplo
-- -------------------------------------------------------
INSERT INTO notifications (type, message, product_id, is_read, created_at) VALUES
  ('LOW_STOCK',  'PagoPlus tiene saldo crítico: $38.000 (mínimo: $100.000)', NULL, false, NOW()),
  ('LOW_STOCK',  'RESMA PAPEL BLANCO X500: solo 3 unidades en stock',          7,   false, NOW()),
  ('LOW_STOCK',  'PAÑAL BEBÉ SUAVECARE X20: solo 4 unidades en stock',        13,   false, NOW());

-- -------------------------------------------------------
-- Listo
-- -------------------------------------------------------
SELECT 'Seed completado exitosamente.' AS resultado;
SELECT 'Usuarios demo: adminzafiro / caja01 / caja02 / supervisora / caja03' AS usuarios;
SELECT 'Contraseña de todos: demo1234' AS password;
