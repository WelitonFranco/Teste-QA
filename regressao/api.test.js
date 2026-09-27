const assert = require('node:assert/strict');
const { after, before, beforeEach, test } = require('node:test');
const { createServer } = require('../server.js');
const { reset } = require('../src/store.js');

let servers = [];
let bases = {};

function startServer(version) {
  return new Promise((resolve, reject) => {
    const server = createServer(0, version);
    server.once('error', reject);
    server.once('listening', () => {
      resolve({
        server,
        url: `http://127.0.0.1:${server.address().port}`,
      });
    });
  });
}

async function request(version, path, options) {
  const response = await fetch(`${bases[version]}${path}`, options);
  const body = await response.json();
  return { status: response.status, body };
}

async function createQuote(version, values = {}) {
  return request(version, '/api/cotacoes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cliente: 'QA regressao',
      peso_kg: 9,
      volumes: 4,
      uf_origem: 'SP',
      uf_destino: 'SP',
      ...values,
    }),
  });
}

before(async () => {
  reset();
  const started = await Promise.all(['v1', 'v2'].map(startServer));
  servers = started.map(({ server }) => server);
  bases = Object.fromEntries(started.map((entry, index) => [
    ['v1', 'v2'][index], entry.url,
  ]));
});

beforeEach(() => reset());

after(async () => {
  reset();
  await Promise.all(servers.map((server) => new Promise((resolve) => {
    server.close(resolve);
  })));
});

test('v1 e v2 identificam a versão e mantêm as 200 cotações seed', async () => {
  for (const version of ['v1', 'v2']) {
    const versionResponse = await request(version, '/api/versao');
    const quotes = await request(version, '/api/cotacoes?page=1&limit=200');
    assert.equal(versionResponse.body.versao, version);
    assert.equal(quotes.body.total, 200);
    assert.equal(quotes.body.itens.length, 200);
  }
});

test('v1 preserva os limites inclusivos das faixas de peso', async () => {
  const expectedBases = new Map([[10, 25], [50, 60], [100, 110]]);
  for (const [weight, expectedBase] of expectedBases) {
    const quote = await createQuote('v1', { peso_kg: weight });
    assert.equal(quote.status, 201);
    assert.equal(quote.body.valor_base, expectedBase);
  }
});

test('v1 e v2 preservam os multiplicadores e preços das rotas sem desconto', async () => {
  const scenarios = [
    { uf_origem: 'SP', uf_destino: 'SP', expected: 28 },
    { uf_origem: 'SP', uf_destino: 'RJ', expected: 39.2 },
    { uf_origem: 'SP', uf_destino: 'BA', expected: 53.2 },
  ];
  for (const version of ['v1', 'v2']) {
    for (const scenario of scenarios) {
      const quote = await createQuote(version, scenario);
      assert.equal(quote.body.valor_total, scenario.expected);
    }
  }
});

test('v2 aplica os descontos nos limites especificados', async () => {
  const expectedDiscounts = new Map([
    [9, 0], [10, 0.05], [11, 0.05], [19, 0.05],
    [20, 0.1], [21, 0.1], [49, 0.1], [50, 0.15], [51, 0.15],
  ]);
  const actual = [];
  for (const [volumes] of expectedDiscounts) {
    const quote = await createQuote('v2', { volumes });
    actual.push([volumes, quote.body.desconto]);
  }
  assert.deepEqual(actual, [...expectedDiscounts]);
});

test('v2 atende os três exemplos de desconto da especificação', async () => {
  const scenarios = new Map([
    [3, [0, 28]], [15, [0.05, 26.6]], [30, [0.1, 25.2]], [80, [0.15, 23.8]],
  ]);
  for (const [volumes, [discount, total]] of scenarios) {
    const quote = await createQuote('v2', { volumes });
    assert.equal(quote.body.desconto, discount);
    assert.equal(quote.body.valor_total, total);
  }
});

test('v2 mantém as faixas de peso inclusivas da v1', async () => {
  const expectedBases = new Map([[10, 25], [50, 60], [100, 110]]);
  for (const [weight, expectedBase] of expectedBases) {
    const quote = await createQuote('v2', { peso_kg: weight });
    assert.equal(quote.status, 201);
    assert.equal(quote.body.valor_base, expectedBase);
  }
});

test('v2 preserva o total das cotações já faturadas', async () => {
  for (const id of Array.from({ length: 60 }, (_, index) => index + 1)) {
    const production = await request('v1', `/api/cotacoes/${id}`);
    const candidate = await request('v2', `/api/cotacoes/${id}`);
    assert.equal(candidate.body.faturada, true);
    assert.equal(candidate.body.valor_total, production.body.valor_total);
  }
});

test('v2 calcula desconto sobre o valor já acrescido do imposto e arredonda centavos', async () => {
  const quote = await createQuote('v2', { volumes: 15, uf_destino: 'BA' });
  assert.equal(quote.body.desconto, 0.05);
  assert.equal(quote.body.valor_total, 50.54);
});

test('listagem v2 mantém desconto e valor consistentes com o detalhe', async () => {
  const created = await createQuote('v2', { volumes: 15 });
  const detail = await request('v2', `/api/cotacoes/${created.body.id}`);
  const page = await request('v2', '/api/cotacoes?page=1&limit=500');
  const item = page.body.itens.find((quote) => quote.id === created.body.id);
  assert.equal(item.desconto, detail.body.desconto);
  assert.equal(item.valor_total, detail.body.valor_total);
});

test('listagem, filtro e paginação funcionam nas duas versões', async () => {
  for (const version of ['v1', 'v2']) {
    const page = await request(version, '/api/cotacoes?page=2&limit=7');
    const filtered = await request(
      version,
      '/api/cotacoes?cliente=Comercial%20Aurora&limit=200',
    );
    assert.equal(page.body.total, 200);
    assert.equal(page.body.itens.length, 7);
    assert.ok(filtered.body.itens.length > 0);
    assert.ok(filtered.body.itens.every((quote) => quote.cliente === 'Comercial Aurora'));
  }
});

test('criação valida campos e rotas inexistentes mantêm os status documentados', async () => {
  const invalid = await request('v2', '/api/cotacoes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cliente: 'QA' }),
  });
  const missingDetail = await request('v2', '/api/cotacoes/9999');
  const missingInvoice = await request('v2', '/api/cotacoes/9999/faturar', { method: 'POST' });
  assert.equal(invalid.status, 422);
  assert.equal(missingDetail.status, 404);
  assert.equal(missingInvoice.status, 404);
});

test('faturamento sequencial preserva o valor e recusa a segunda emissão', async () => {
  const created = await createQuote('v2');
  const path = `/api/cotacoes/${created.body.id}/faturar`;
  const first = await request('v2', path, { method: 'POST' });
  const second = await request('v2', path, { method: 'POST' });
  const invoices = await request('v2', `/api/faturas?id_cotacao=${created.body.id}`);
  assert.equal(first.status, 201);
  assert.equal(first.body.valor, created.body.valor_total);
  assert.equal(second.status, 409);
  assert.equal(invoices.body.length, 1);
});

test('cotações faturadas na carga seed incluem o valor cobrado', async () => {
  for (const version of ['v1', 'v2']) {
    const invoices = await request(version, '/api/faturas');
    assert.equal(invoices.body.length, 60);
    assert.ok(invoices.body.every((invoice) => Number.isFinite(invoice.valor)));
  }
});

test('faturamento concorrente emite uma única fatura por cotação', async () => {
  const created = await createQuote('v2');
  const path = `/api/cotacoes/${created.body.id}/faturar`;
  const results = await Promise.all([
    request('v2', path, { method: 'POST' }),
    request('v2', path, { method: 'POST' }),
  ]);
  assert.deepEqual(results.map((result) => result.status).sort(), [201, 409]);
  const invoices = await request('v2', `/api/faturas?id_cotacao=${created.body.id}`);
  assert.equal(invoices.body.length, 1);
});