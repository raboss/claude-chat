/* ============================================================
   NouRion — src/services/repository.test.js
   Run with:  node src/services/repository.test.js
   ============================================================ */

'use strict';

var R = require('./repository.js');

var pass = 0, fail = 0;
function ok(name, cond) {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else      { fail++; console.log('  ✗ ' + name); }
}
function section(name) { console.log('\n• ' + name); }

// ----- Memory store that mimics localStorage -----
function MemoryStore() { this.map = Object.create(null); }
MemoryStore.prototype.getItem = function (k) { return Object.prototype.hasOwnProperty.call(this.map, k) ? this.map[k] : null; };
MemoryStore.prototype.setItem = function (k, v) { this.map[k] = String(v); };
MemoryStore.prototype.removeItem = function (k) { delete this.map[k]; };

// ----- Fake fetch for HttpTransport -----
function makeFakeFetch(db) {
  return async function (url, opts) {
    var match = url.match(/\/api\/data\/([^/?]+)$/);
    if (!match) {
      return { ok: false, status: 404, json: async function () { return {}; } };
    }
    var key = decodeURIComponent(match[1]);
    var method = (opts && opts.method) || 'GET';
    if (method === 'GET') {
      return {
        ok: true, status: 200,
        json: async function () { return { ok: true, key: key, value: db[key] || [] }; }
      };
    }
    if (method === 'POST') {
      var body = JSON.parse(opts.body);
      db[key] = body.value;
      return {
        ok: true, status: 200,
        json: async function () { return { ok: true, key: key }; }
      };
    }
    if (method === 'DELETE') {
      delete db[key];
      return {
        ok: true, status: 200,
        json: async function () { return { ok: true, key: key }; }
      };
    }
    return { ok: false, status: 405, json: async function () { return {}; } };
  };
}

(async function run() {
  console.log('NouRion · repository.js · self-tests');
  console.log('====================================');

  // -------- EventBus --------
  section('EventBus');
  var bus = new R.EventBus();
  var hits = [];
  var off = bus.on('x', function (p) { hits.push(p); });
  bus.emit('x', 1);
  bus.emit('x', 2);
  ok('received 2 events',     hits.length === 2);
  ok('payloads correct',      hits[0] === 1 && hits[1] === 2);
  off();
  bus.emit('x', 3);
  ok('unsubscribe works',     hits.length === 2);

  var errorCount = 0;
  bus.on('err', function () { throw new Error('boom'); });
  bus.on('err', function () { errorCount++; });
  bus.emit('err', null);
  ok('error in listener does not break chain', errorCount === 1);

  // -------- HttpTransport --------
  section('HttpTransport');
  var db = {};
  var tr = new R.HttpTransport({ fetch: makeFakeFetch(db) });
  var postResp = await tr.post('/api/data/pm_test', { value: [1, 2, 3] });
  ok('post ok',               postResp.ok === true);
  var getResp = await tr.get('/api/data/pm_test');
  ok('get returns value',     JSON.stringify(getResp.value) === '[1,2,3]');

  tr.setCsrf('csrf-abc');
  ok('csrf token stored',     tr.csrfToken === 'csrf-abc');

  // -------- Repository basics --------
  section('Repository CRUD (memory only)');
  var store = new MemoryStore();
  var repo = new R.Repository({ key: 'pm_projects', store: store });
  await repo.load();
  ok('loads empty initially', repo.size() === 0);

  var p1 = await repo.create({ name: 'Villa A' });
  ok('create returns item with id', typeof p1.id === 'string' && p1.id.length > 0);
  ok('create persisted',             repo.size() === 1);
  ok('find by id',                   repo.find(p1.id).name === 'Villa A');

  var p2 = await repo.create({ id: 'fixed-id', name: 'Tower B' });
  ok('create with explicit id',      p2.id === 'fixed-id');
  ok('repo size 2',                  repo.size() === 2);

  var updated = await repo.update('fixed-id', { name: 'Tower B — updated', area: 1200 });
  ok('update merged fields',         updated.name === 'Tower B — updated' && updated.area === 1200);
  ok('update preserved id',          updated.id === 'fixed-id');

  var gone = await repo.remove(p1.id);
  ok('remove returns true',          gone === true);
  ok('repo size 1 after remove',     repo.size() === 1);
  ok('removed item not found',       repo.find(p1.id) === null);

  // Duplicate create
  var dup = false;
  try { await repo.create({ id: 'fixed-id', name: 'x' }); }
  catch (e) { dup = /already exists/.test(e.message); }
  ok('duplicate id throws',          dup === true);

  // Update missing
  var miss = false;
  try { await repo.update('no-such', { a: 1 }); }
  catch (e) { miss = /not found/.test(e.message); }
  ok('update missing throws',        miss === true);

  // Remove missing
  var no = await repo.remove('no-such');
  ok('remove missing returns false', no === false);

  // Upsert
  var ins = await repo.upsert({ name: 'Shop C' });
  ok('upsert creates when no id',    repo.find(ins.id) !== null);
  var upd = await repo.upsert({ id: 'fixed-id', name: 'Tower B — v2' });
  ok('upsert updates existing',      repo.find('fixed-id').name === 'Tower B — v2');

  // where
  var matches = repo.where(function (x) { return /Tower/.test(x.name); });
  ok('where filters correctly',      matches.length === 1 && matches[0].id === 'fixed-id');

  // clear
  await repo.clear();
  ok('clear empties repo',           repo.size() === 0);

  // -------- Events --------
  section('Repository events');
  var repo2 = new R.Repository({ key: 'pm_items', store: new MemoryStore() });
  await repo2.load();
  var events = [];
  repo2.on('changed', function (p) { events.push(p.reason); });
  await repo2.create({ name: 'a' });
  var itemId = repo2.all()[0].id;
  await repo2.update(itemId, { name: 'b' });
  await repo2.remove(itemId);
  ok('create emitted',  events[0] === 'create');
  ok('update emitted',  events[1] === 'update');
  ok('remove emitted',  events[2] === 'remove');

  // -------- LocalStorage mirror --------
  section('Local store mirror');
  var store2 = new MemoryStore();
  var repo3 = new R.Repository({ key: 'pm_forms', store: store2 });
  await repo3.load();
  await repo3.create({ name: 'Form 1' });
  await repo3.create({ name: 'Form 2' });
  var raw = store2.getItem('pm_forms');
  ok('store has serialized list',  typeof raw === 'string' && raw.length > 10);
  var arr = JSON.parse(raw);
  ok('serialized list length 2',    arr.length === 2);

  // New repo with pre-populated store should load from it
  var repo4 = new R.Repository({ key: 'pm_forms', store: store2 });
  await repo4.load();
  ok('repo4 loads from store',     repo4.size() === 2);

  // -------- HTTP-backed repository --------
  section('Repository with HttpTransport');
  var db2 = {};
  var tr2 = new R.HttpTransport({ fetch: makeFakeFetch(db2) });
  var repoH = new R.Repository({ key: 'pm_projects', transport: tr2, store: new MemoryStore() });
  await repoH.load();
  ok('http repo empty initially',   repoH.size() === 0);

  await repoH.create({ name: 'Server-side villa' });
  ok('db stored via post',          db2.pm_projects && db2.pm_projects.length === 1);

  var repoH2 = new R.Repository({ key: 'pm_projects', transport: tr2, store: new MemoryStore() });
  await repoH2.load();
  ok('new repo loads from http',    repoH2.size() === 1);
  ok('item name matches',           repoH2.all()[0].name === 'Server-side villa');

  // -------- RepositoryFactory --------
  section('RepositoryFactory');
  var f = new R.RepositoryFactory({ store: new MemoryStore() });
  var projects = f.projects();
  var projects2 = f.projects();
  ok('factory returns same instance', projects === projects2);
  ok('projects key correct',          projects.key === 'pm_projects');
  ok('forms key correct',             f.forms().key === 'pm_forms');
  ok('sections key correct',          f.sections().key === 'pm_sections');
  ok('employees key correct',         f.employees().key === 'pm_employees');

  // -------- summary --------
  console.log('\n====================================');
  console.log('  passed: ' + pass);
  console.log('  failed: ' + fail);
  console.log('====================================');
  if (fail > 0) process.exit(1);
})().catch(function (err) {
  console.error('TEST RUN ERROR:', err);
  process.exit(2);
});
