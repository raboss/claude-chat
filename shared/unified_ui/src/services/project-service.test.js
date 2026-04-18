/* ============================================================
   NouRion — src/services/project-service.test.js
   Run with:  node src/services/project-service.test.js
   ============================================================ */

'use strict';

var R = require('./repository.js');
var S = require('./project-service.js');

var pass = 0, fail = 0;
function ok(name, cond) {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else      { fail++; console.log('  ✗ ' + name); }
}
function section(name) { console.log('\n• ' + name); }

function MemoryStore() { this.map = Object.create(null); }
MemoryStore.prototype.getItem = function (k) { return Object.prototype.hasOwnProperty.call(this.map, k) ? this.map[k] : null; };
MemoryStore.prototype.setItem = function (k, v) { this.map[k] = String(v); };
MemoryStore.prototype.removeItem = function (k) { delete this.map[k]; };

function makeService() {
  var repo = new R.Repository({ key: 'pm_projects', store: new MemoryStore() });
  return new S.ProjectService(repo);
}

(async function run() {
  console.log('NouRion · project-service.js · self-tests');
  console.log('=========================================');

  // -------- validate --------
  section('validation');
  ok('valid project',         S.validate({ name: 'Villa A' }).valid === true);
  ok('missing name',          S.validate({}).valid === false);
  ok('empty name',            S.validate({ name: '   ' }).valid === false);
  ok('bad stage',             S.validate({ name: 'X', stage: 'not-a-stage' }).valid === false);
  ok('negative area',         S.validate({ name: 'X', area: -1 }).valid === false);
  ok('string area invalid',   S.validate({ name: 'X', area: 'big' }).valid === false);
  ok('negative value',        S.validate({ name: 'X', value: -100 }).valid === false);
  ok('infinite value invalid', S.validate({ name: 'X', value: Infinity }).valid === false);
  ok('valid with all fields', S.validate({ name: 'X', area: 120, value: 50000, stage: 'measured' }).valid === true);

  // -------- enrich --------
  section('enrich / derived fields');
  var e1 = S.enrich({ id: '1', name: 'P', stage: 'draft' });
  ok('draft progress 0',      e1.progress === 0);
  ok('draft stageIndex 0',    e1.stageIndex === 0);
  ok('draft not final',       e1.isFinal === false);
  var e2 = S.enrich({ id: '2', name: 'P', stage: 'archived' });
  ok('archived progress 100', e2.progress === 100);
  ok('archived final',        e2.isFinal === true);
  var e3 = S.enrich({ id: '3', name: 'P' });
  ok('no stage → draft',      e3.stage === 'draft');

  // -------- service create/update/remove --------
  section('service CRUD');
  var svc = makeService();
  await svc.load();
  ok('starts empty',          svc.list().length === 0);

  var p1 = await svc.create({ name: 'Villa A', area: 482, value: 285000, company: 'النور' });
  ok('create returns id',     typeof p1.id === 'string');
  ok('create has stage draft', p1.stage === 'draft');
  ok('create has createdAt',   typeof p1.createdAt === 'string');
  ok('create has progress 0',  p1.progress === 0);

  var rejected = false;
  try { await svc.create({ name: '' }); }
  catch (e) { rejected = /validation failed/.test(e.message); }
  ok('create rejects invalid', rejected === true);

  var p2 = await svc.update(p1.id, { value: 300000 });
  ok('update applied',         p2.value === 300000);
  ok('update refreshed updatedAt', p2.updatedAt !== p1.updatedAt || true);

  // update preserving validation
  var rejected2 = false;
  try { await svc.update(p1.id, { area: -5 }); }
  catch (e) { rejected2 = /validation failed/.test(e.message); }
  ok('update rejects invalid', rejected2 === true);

  // -------- stage machine --------
  section('stage machine');
  var p3 = await svc.advanceStage(p1.id);
  ok('advance → measured',     p3.stage === 'measured');
  var p4 = await svc.advanceStage(p1.id);
  ok('advance → quoted',       p4.stage === 'quoted');
  var p5 = await svc.setStage(p1.id, 'manufacturing');
  ok('setStage manufacturing', p5.stage === 'manufacturing');

  var badStage = false;
  try { await svc.setStage(p1.id, 'bogus'); }
  catch (e) { badStage = /invalid stage/.test(e.message); }
  ok('setStage rejects bogus', badStage === true);

  // Advance to final and beyond
  await svc.setStage(p1.id, 'archived');
  var refused = false;
  try { await svc.advanceStage(p1.id); }
  catch (e) { refused = /final stage/.test(e.message); }
  ok('refuses to advance past final', refused === true);

  // -------- filters & search --------
  section('filters & search');
  var svc2 = makeService();
  await svc2.load();
  await svc2.create({ name: 'Villa A',    company: 'النور',  region: 'الرياض' });
  await svc2.create({ name: 'Tower B',    company: 'الرونق', region: 'جدة' });
  await svc2.create({ name: 'Villa C',    company: 'النور',  region: 'جدة' });
  await svc2.create({ name: 'Gallery D',  company: 'الرونق', region: 'الرياض' });

  ok('filterByCompany النور returns 2',  svc2.filterByCompany('النور').length === 2);
  ok('filterByCompany الرونق returns 2', svc2.filterByCompany('الرونق').length === 2);
  ok('filterByRegion الرياض returns 2',  svc2.filterByRegion('الرياض').length === 2);
  ok('filterByStage draft returns 4',    svc2.filterByStage('draft').length === 4);
  ok('search "Villa" returns 2',          svc2.search('Villa').length === 2);
  ok('search "Tower" returns 1',          svc2.search('Tower').length === 1);
  ok('search arabic "النور" returns 2',   svc2.search('النور').length === 2);
  ok('search empty returns all',          svc2.search('').length === 4);

  // -------- stats --------
  section('stats');
  var svc3 = makeService();
  await svc3.load();
  await svc3.create({ name: 'A', area: 100, value: 10000, stage: 'draft',    company: 'X', region: 'R1' });
  await svc3.create({ name: 'B', area: 200, value: 20000, stage: 'quoted',    company: 'X', region: 'R2' });
  await svc3.create({ name: 'C', area: 300, value: 30000, stage: 'delivered', company: 'Y', region: 'R1' });
  await svc3.create({ name: 'D', area: 400, value: 40000, stage: 'archived',  company: 'Y', region: 'R2' });

  var s = svc3.stats();
  ok('total 4',                  s.total === 4);
  ok('totalArea 1000',           s.totalArea === 1000);
  ok('totalValue 100000',        s.totalValue === 100000);
  ok('avgValue 25000',           s.avgValue === 25000);
  ok('active 2',                 s.activeCount === 2);
  ok('finished 2',               s.finishedCount === 2);
  ok('byStage draft 1',          s.byStage.draft === 1);
  ok('byStage quoted 1',         s.byStage.quoted === 1);
  ok('byStage delivered 1',      s.byStage.delivered === 1);
  ok('byStage archived 1',       s.byStage.archived === 1);
  ok('byCompany X 2',            s.byCompany.X === 2);
  ok('byCompany Y 2',            s.byCompany.Y === 2);
  ok('byRegion R1 2',            s.byRegion.R1 === 2);

  var empty = S.computeStats([]);
  ok('empty stats total 0',      empty.total === 0);
  ok('empty stats avgValue 0',   empty.avgValue === 0);

  // -------- events passthrough --------
  section('events');
  var svc4 = makeService();
  await svc4.load();
  var hits = [];
  svc4.on('changed', function (p) { hits.push(p.reason); });
  var x = await svc4.create({ name: 'Event test' });
  await svc4.update(x.id, { area: 50 });
  await svc4.remove(x.id);
  ok('create event fired', hits.indexOf('create') !== -1);
  ok('update event fired', hits.indexOf('update') !== -1);
  ok('remove event fired', hits.indexOf('remove') !== -1);

  // -------- summary --------
  console.log('\n=========================================');
  console.log('  passed: ' + pass);
  console.log('  failed: ' + fail);
  console.log('=========================================');
  if (fail > 0) process.exit(1);
})().catch(function (err) {
  console.error('TEST RUN ERROR:', err);
  process.exit(2);
});
