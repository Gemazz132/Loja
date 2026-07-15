'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const db = require('../db/database');

// ── Admin ──────────────────────────────────────────────────────────────────
const adminEmail = process.env.ADMIN_EMAIL || 'admin@aurum.pt';
const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
const adminName = process.env.ADMIN_NAME || 'Administrador AURUM';

const existingAdmin = db.prepare('SELECT id FROM admins WHERE email = ?').get(adminEmail);
if (!existingAdmin) {
  const hash = bcrypt.hashSync(adminPassword, 10);
  const roleAdmin = db.prepare("SELECT id FROM roles WHERE nome = 'admin'").get();
  db.prepare('INSERT INTO admins (nome, email, password_hash, role_id) VALUES (?, ?, ?, ?)')
    .run(adminName, adminEmail, hash, roleAdmin ? roleAdmin.id : null);
  console.log(`✔ Admin criado: ${adminEmail} (role: admin)`);
} else {
  console.log(`ℹ Admin já existe: ${adminEmail}`);
}

// ── Produtos ───────────────────────────────────────────────────────────────
const produtos = [
  {
    nome: 'Casaco Oversize Premium',
    descricao: 'Casaco oversized em lã virgem com acabamento premium.',
    descricao_longa: 'Desenhado para quem recusa escolher entre conforto e estilo, este casaco oversized combina proporções contemporâneas com materiais de primeira linha. Confeccionado em lã virgem com forro interior em viscose, oferece um caimento impecável e isolamento natural. As costuras reforçadas e o fecho em metal escovado garantem durabilidade sem comprometer a leveza. Ideal para usar sobre qualquer look, do mais casual ao mais formal.',
    preco: 189.99,
    preco_promocional: 149.99,
    categoria: 'casacos',
    imagem: null,
    tamanhos: JSON.stringify(['XS', 'S', 'M', 'L', 'XL']),
    cores: JSON.stringify(['Camel', 'Preto', 'Cinzento']),
    stock: 24,
    ativo: 1,
    destaque: 1,
    material: '80% Lã Virgem, 20% Poliamida — Forro: 100% Viscose',
    instrucoes_lavagem: 'Lavagem a seco recomendada. Não torcer. Secar na horizontal.',
  },
  {
    nome: 'Camisola Essential Merino',
    descricao: 'Camisola de gola redonda em lã merino extrafina.',
    descricao_longa: 'A camisola essencial que não deve faltar no guarda-roupa de qualquer pessoa com gosto apurado. Feita em lã merino extrafina (17.5 microns) de origem responsável, é incrivelmente suave contra a pele e regula naturalmente a temperatura corporal. O corte ligeiramente relaxado permite sobrepor peças sem criar volume excessivo. Disponível numa paleta de tons neutros escolhidos para combinar com tudo.',
    preco: 89.99,
    preco_promocional: null,
    categoria: 'camisolas',
    imagem: null,
    tamanhos: JSON.stringify(['XS', 'S', 'M', 'L', 'XL', 'XXL']),
    cores: JSON.stringify(['Creme', 'Navy', 'Antracite', 'Toupeira']),
    stock: 48,
    ativo: 1,
    destaque: 1,
    material: '100% Lã Merino Extrafina',
    instrucoes_lavagem: 'Lavar à mão em água fria. Não usar alvejante. Secar na horizontal.',
  },
  {
    nome: 'Calças Alfaiataria Slim',
    descricao: 'Calças de alfaiataria slim fit em tecido stretch.',
    descricao_longa: 'A fusão perfeita entre a elegância da alfaiataria clássica e o conforto do tecido técnico moderno. O corte slim fit valoriza a silhueta sem restringir o movimento, graças à incorporação de 3% de elastano na composição. O tecido de lã-stretch mantém a forma ao longo do dia e resiste a amarrotamentos. Com bolsos funcionais e cós regulável, são igualmente adequadas para o escritório ou para um jantar fora.',
    preco: 129.99,
    preco_promocional: 99.99,
    categoria: 'calcas',
    imagem: null,
    tamanhos: JSON.stringify(['36', '38', '40', '42', '44', '46']),
    cores: JSON.stringify(['Preto', 'Cinzento Escuro', 'Navy', 'Bege']),
    stock: 36,
    ativo: 1,
    destaque: 0,
    material: '67% Lã, 30% Poliéster, 3% Elastano',
    instrucoes_lavagem: 'Lavar a 30°C. Não usar secador. Passar a ferro a temperatura média.',
  },
  {
    nome: 'T-Shirt Organic Logo',
    descricao: 'T-shirt em algodão orgânico com bordado minimalista.',
    descricao_longa: 'Simplicidade levada a sério. Esta t-shirt é feita em algodão orgânico certificado GOTS, cultivado sem pesticidas e tingido com corantes azo-free. O corte regular oferece uma silhueta descontraída sem ser larga demais. O logótipo AURUM está bordado com fio de algodão reciclado, garantindo um acabamento premium que resiste a inúmeras lavagens. Uma peça básica que se recusa a ser banal.',
    preco: 45.00,
    preco_promocional: null,
    categoria: 'tshirts',
    imagem: null,
    tamanhos: JSON.stringify(['XS', 'S', 'M', 'L', 'XL', 'XXL']),
    cores: JSON.stringify(['Branco', 'Preto', 'Cinzento Mesclado', 'Sage']),
    stock: 80,
    ativo: 1,
    destaque: 0,
    material: '100% Algodão Orgânico Certificado GOTS',
    instrucoes_lavagem: 'Lavar a 40°C. Pode usar secador a temperatura baixa. Passar a ferro a vapor.',
  },
  {
    nome: 'Camisa Oxford Relaxed',
    descricao: 'Camisa Oxford em algodão lavado, corte relaxado.',
    descricao_longa: 'A camisa Oxford é um clássico, mas esta versão reimagina-a para o uso contemporâneo. O algodão é lavado em pedra para criar uma textura levemente vintage e uma maciez imediata — sem o período de "amolecimento" que as camisas novas normalmente exigem. O corte relaxed com costura dos ombros ligeiramente descida cria uma estética descontraída. Pode ser usada tucked in ou untucked com igual elegância.',
    preco: 79.99,
    preco_promocional: 64.99,
    categoria: 'camisas',
    imagem: null,
    tamanhos: JSON.stringify(['XS', 'S', 'M', 'L', 'XL']),
    cores: JSON.stringify(['Branco', 'Azul Claro', 'Riscas Navy']),
    stock: 32,
    ativo: 1,
    destaque: 1,
    material: '100% Algodão Oxford Lavado em Pedra',
    instrucoes_lavagem: 'Lavar a 30°C. Não usar lixívia. Passar a ferro húmido.',
  },
  {
    nome: 'Blazer Estruturado Linho',
    descricao: 'Blazer em linho italiano com estrutura suave.',
    descricao_longa: 'O linho italiano é um dos tecidos mais nobres para a estação quente, e este blazer demonstra porquê. Com uma construção "deconstructed" que elimina entretelas rígidas desnecessárias, cai de forma natural e confortável mesmo nas temperaturas mais elevadas. Os bolsos com pesponto visível e os botões em coco são detalhes que revelam a atenção ao artesanato. Uma peça versátil que eleva qualquer conjunto, de jeans a calças de alfaiataria.',
    preco: 219.99,
    preco_promocional: null,
    categoria: 'casacos',
    imagem: null,
    tamanhos: JSON.stringify(['XS', 'S', 'M', 'L', 'XL']),
    cores: JSON.stringify(['Natural', 'Caqui', 'Azul Marinho']),
    stock: 18,
    ativo: 1,
    destaque: 1,
    material: '100% Linho Italiano',
    instrucoes_lavagem: 'Lavagem a seco recomendada. Lavar à mão suavemente. Não torcer.',
  },
  {
    nome: 'Hoodie Fleece Premium',
    descricao: 'Hoodie em fleece de algodão brushed, corte moderno.',
    descricao_longa: 'Conforto sem concessões estéticas. Este hoodie é feito em fleece de algodão escovado por dentro, criando uma superfície exterior lisa e um interior incrivelmente macio. O corte é cuidadosamente proporcional: nem demasiado largo para parecer desleixado, nem demasiado justo para comprometer o conforto. O bolso kangaroo tem divisória interior e o cordão é plano para não torcer. Uma peça que se torna favorita imediatamente.',
    preco: 95.00,
    preco_promocional: null,
    categoria: 'camisolas',
    imagem: null,
    tamanhos: JSON.stringify(['XS', 'S', 'M', 'L', 'XL', 'XXL']),
    cores: JSON.stringify(['Preto', 'Cinzento', 'Creme', 'Bordeaux']),
    stock: 55,
    ativo: 1,
    destaque: 0,
    material: '80% Algodão, 20% Poliéster Brushed Fleece',
    instrucoes_lavagem: 'Lavar a 30°C ao contrário. Pode usar secador a temperatura baixa.',
  },
  {
    nome: 'Saia Midi Plissada',
    descricao: 'Saia midi plissada em tecido fluido, cintura elástica.',
    descricao_longa: 'Feminilidade em movimento. Esta saia midi em chiffon de poliéster reciclado cria ondas de tecido que acompanham cada passo com graça. O plissado é permanente e mantém a sua estrutura após lavagem. A cintura elástica forrada oferece conforto todo o dia sem marcar. O comprimento midi é deliberadamente versátil: pode ser usada com sapatilhas numa tarde casual ou com mules no escritório.',
    preco: 74.99,
    preco_promocional: 59.99,
    categoria: 'saias',
    imagem: null,
    tamanhos: JSON.stringify(['XS', 'S', 'M', 'L', 'XL']),
    cores: JSON.stringify(['Preto', 'Bege', 'Vinho', 'Verde Esmeralda']),
    stock: 28,
    ativo: 1,
    destaque: 0,
    material: '100% Poliéster Reciclado GRS',
    instrucoes_lavagem: 'Lavar à mão ou em programa delicado a 30°C. Não usar secador. Não passar a ferro.',
  },
  {
    nome: 'Vestido Midi Estruturado',
    descricao: 'Vestido midi de malha canelada com manga comprida.',
    descricao_longa: 'Um vestido que não precisa de ocasião especial para ser usado. A malha canelada em viscose-elastano abraça a silhueta sem apertar, e a manga comprida garante versatilidade durante todo o ano. O decote V controlado e o comprimento midi tornam-no adequado para quase qualquer contexto. Os detalhes de costura a contraste são uma assinatura discreta que distingue esta peça das alternativas do mercado.',
    preco: 109.99,
    preco_promocional: null,
    categoria: 'vestidos',
    imagem: null,
    tamanhos: JSON.stringify(['XS', 'S', 'M', 'L', 'XL']),
    cores: JSON.stringify(['Preto', 'Chocolate', 'Creme', 'Borgonha']),
    stock: 22,
    ativo: 1,
    destaque: 1,
    material: '92% Viscose, 8% Elastano',
    instrucoes_lavagem: 'Lavar à mão em água fria. Não torcer. Secar à sombra na horizontal.',
  },
  {
    nome: 'Cardigan Oversized Mohair',
    descricao: 'Cardigan oversized em mistura de mohair, textura fuzzy.',
    descricao_longa: 'Luxo tátil sem ostentação. A mistura de mohair e seda cria uma textura fuzzy característica que é simultaneamente visual e sensorial. O corte oversized permite layering generoso sobre camisolas e camisas. Os botões de madeira natural são escolhidos à mão para variar ligeiramente em tonalidade, tornando cada peça única. Uma declaração de presença feita em silêncio.',
    preco: 155.00,
    preco_promocional: 125.00,
    categoria: 'camisolas',
    imagem: null,
    tamanhos: JSON.stringify(['S/M', 'L/XL']),
    cores: JSON.stringify(['Bege Fuzzy', 'Rosa Pálido', 'Azul Neblina']),
    stock: 15,
    ativo: 1,
    destaque: 1,
    material: '70% Mohair, 25% Poliamida, 5% Lã',
    instrucoes_lavagem: 'Lavagem a seco apenas. Guardar dobrado, nunca pendurado.',
  },
  {
    nome: 'Jeans Wide Leg Premium',
    descricao: 'Jeans wide leg em denim japonês selvedge.',
    descricao_longa: 'Para os que sabem a diferença que o denim faz. Estes jeans são confeccionados em denim selvedge japonês de 12oz, tecido em tear original para uma textura e durabilidade que os denims modernos raramente igualam. O corte wide leg de cintura alta é simultaneamente cómodo e elegante. Com o tempo e uso, o denim desenvolve fades únicos e personalizados — cada par conta uma história diferente.',
    preco: 175.00,
    preco_promocional: null,
    categoria: 'calcas',
    imagem: null,
    tamanhos: JSON.stringify(['24', '25', '26', '27', '28', '29', '30', '31', '32']),
    cores: JSON.stringify(['Índigo Raw', 'Lavado Médio', 'Preto Rígido']),
    stock: 20,
    ativo: 1,
    destaque: 0,
    material: '100% Algodão Selvedge Japonês (12oz)',
    instrucoes_lavagem: 'Lavar raramente, somente quando necessário. Lavar ao contrário a 30°C. Secar ao ar.',
  },
  {
    nome: 'Trench Coat Clássico',
    descricao: 'Trench coat em gabardine de algodão, corte atemporal.',
    descricao_longa: 'Há peças que transcendem as tendências, e o trench coat é a melhor prova disso. Esta versão é feita em gabardine de algodão com tratamento DWR (repelente de água durável) que mantém a leveza do tecido sem recorrer a materiais sintéticos pesados. Todos os detalhes clássicos estão presentes — patilhas de ombro, cinto duplo, fivela D — executados com a qualidade que uma peça desta categoria merece. Um investimento que dura décadas.',
    preco: 299.99,
    preco_promocional: 249.99,
    categoria: 'casacos',
    imagem: null,
    tamanhos: JSON.stringify(['XS', 'S', 'M', 'L', 'XL']),
    cores: JSON.stringify(['Camel', 'Preto', 'Bege Clássico']),
    stock: 12,
    ativo: 1,
    destaque: 1,
    material: '100% Algodão Gabardine com tratamento DWR',
    instrucoes_lavagem: 'Lavagem a seco recomendada. Não usar secador. Guardar num cabide acolchoado.',
  },
];

const insertProduto = db.prepare(`
  INSERT OR IGNORE INTO produtos
    (nome, descricao, descricao_longa, preco, preco_promocional, categoria, imagem,
     tamanhos, cores, stock, ativo, destaque, material, instrucoes_lavagem)
  VALUES
    (@nome, @descricao, @descricao_longa, @preco, @preco_promocional, @categoria, @imagem,
     @tamanhos, @cores, @stock, @ativo, @destaque, @material, @instrucoes_lavagem)
`);

const insertMany = db.transaction((rows) => {
  for (const row of rows) insertProduto.run(row);
});

const count = db.prepare('SELECT COUNT(*) as n FROM produtos').get().n;
if (count === 0) {
  insertMany(produtos);
  console.log(`✔ ${produtos.length} produtos criados.`);
} else {
  console.log(`ℹ Produtos já existem (${count}). Seed ignorado.`);
}

console.log('✅ Seed concluído.');
process.exit(0);
