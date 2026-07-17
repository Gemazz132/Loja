-- 003_categorias.sql — categorias reais para a loja (substitui os filtros
-- estáticos no HTML). produtos.categoria continua a guardar o SLUG (estável),
-- e esta tabela guarda o NOME apresentado — assim, editar o nome no admin
-- nunca obriga a tocar nos produtos existentes.

CREATE TABLE IF NOT EXISTS categorias (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  ordem INTEGER DEFAULT 0,
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Semear a partir das categorias (slugs) já usadas nos produtos existentes,
-- para a loja continuar a mostrar exactamente os mesmos filtros de sempre.
INSERT OR IGNORE INTO categorias (nome, slug, ordem)
SELECT
  CASE categoria
    WHEN 'casacos'   THEN 'Casacos'
    WHEN 'camisolas' THEN 'Camisolas'
    WHEN 'camisas'   THEN 'Camisas'
    WHEN 'tshirts'   THEN 'T-Shirts'
    WHEN 'calcas'    THEN 'Calças'
    WHEN 'vestidos'  THEN 'Vestidos'
    WHEN 'saias'     THEN 'Saias'
    ELSE categoria
  END,
  categoria,
  ROW_NUMBER() OVER (ORDER BY categoria)
FROM (SELECT DISTINCT categoria FROM produtos WHERE categoria IS NOT NULL AND categoria != '');
