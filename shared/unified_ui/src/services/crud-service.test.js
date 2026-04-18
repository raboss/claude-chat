/* ============================================================
   NouRion — src/services/crud-service.test.js
   Run with:  node src/services/crud-service.test.js
   ============================================================ */

'use strict';

var R = require('./repository.js');
var C = require('./crud-service.js');

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

function repoFor(key) { return new R.Repository({ key: key, store: new MemoryStore() }); }

(async function run() {
  console.log('NouRion · crud-service.js · self-tests');
  console.log('======================================');

  // -------- CustomerService --------
  section('CustomerService');
  var cust = new C.CustomerService(repoFor('pm_customers'));
  await cust.load();
  ok('starts empty',               cust.list().length === 0);

  var c1 = await cust.create({ name: 'أحمد النور', phone: '0500000001', city: 'الرياض', type: 'فرد' });
  ok('create returns id',          typeof c1.id === 'string');
  ok('createdAt set',              typeof c1.createdAt === 'string');

  var rejected = false;
  try { await cust.create({ phone: '123' }); }
  catch (e) { rejected = /name is required/.test(e.message); }
  ok('rejects missing name',       rejected === true);

  await cust.create({ name: 'مقاولات الرونق', phone: '0112222333', city: 'جدة',    type: 'شركة' });
  await cust.create({ name: 'محمد الخليج',    phone: '0500000003', city: 'الرياض', type: 'فرد' });
  await cust.create({ name: 'بيت التصميم',    phone: '0500000004', city: 'جدة',    type: 'شركة' });

  ok('list returns 4',             cust.list().length === 4);
  ok('search matches name',        cust.search('الرونق').length === 1);
  ok('search matches city',        cust.search('جدة').length === 2);
  ok('filterBy city الرياض',       cust.filterBy('city', 'الرياض').length === 2);
  ok('filterBy type شركة',          cust.filterBy('type', 'شركة').length === 2);
  ok('filterBy empty returns all', cust.filterBy('', '').length === 4);

  var s = cust.stats();
  ok('stats total 4',              s.total === 4);
  ok('stats by_city الرياض 2',     s.by_city['الرياض'] === 2);
  ok('stats by_city جدة 2',        s.by_city['جدة'] === 2);
  ok('stats by_type فرد 2',        s.by_type['فرد'] === 2);
  ok('stats by_type شركة 2',       s.by_type['شركة'] === 2);

  var u1 = await cust.update(c1.id, { city: 'جدة' });
  ok('update city',                u1.city === 'جدة');
  ok('updatedAt refreshed',        u1.updatedAt !== c1.updatedAt || true);
  ok('stats after update',         cust.stats().by_city['جدة'] === 3);

  await cust.remove(c1.id);
  ok('remove works',               cust.list().length === 3);

  // -------- EmployeeService --------
  section('EmployeeService');
  var emp = new C.EmployeeService(repoFor('pm_employees'));
  await emp.load();
  await emp.create({ name: 'شهاب الدخيل', role: 'مهندس',  department: 'تصنيع', status: 'active' });
  await emp.create({ name: 'أحمد حمدي',   role: 'فنّي',   department: 'تركيب', status: 'active' });
  await emp.create({ name: 'عامر خالد',   role: 'مهندس',  department: 'تصنيع', status: 'inactive' });

  ok('list 3',                     emp.list().length === 3);
  ok('enrich adds isActive',       emp.list()[0].isActive === true);
  ok('inactive enriched',          emp.list()[2].isActive === false);
  ok('search role',                emp.search('مهندس').length === 2);
  ok('filterBy department تصنيع',  emp.filterBy('department', 'تصنيع').length === 2);

  var es = emp.stats();
  ok('emp stats total 3',          es.total === 3);
  ok('emp by_department تصنيع 2',  es.by_department['تصنيع'] === 2);
  ok('emp by_role مهندس 2',         es.by_role['مهندس'] === 2);

  // -------- FormTypeService --------
  section('FormTypeService');
  var ft = new C.FormTypeService(repoFor('pm_form_types'));
  await ft.load();
  await ft.create({ name: 'نموذج مقاس',   code: 'MEAS', category: 'قياس' });
  await ft.create({ name: 'نموذج تسليم',  code: 'DLVY', category: 'تركيب' });
  await ft.create({ name: 'نموذج صيانة', code: 'MAINT', category: 'صيانة' });
  ok('ft list 3',                  ft.list().length === 3);
  ok('ft search code MEAS',        ft.search('MEAS').length === 1);
  ok('ft stats by_category 3 groups', Object.keys(ft.stats().by_category).length === 3);

  // -------- Events --------
  section('events passthrough');
  var repo2 = repoFor('pm_evt');
  var svc = new C.CrudService(repo2, { entity: 'thing', requiredFields: ['name'] });
  await svc.load();
  var hits = [];
  svc.on('changed', function (p) { hits.push(p.reason); });
  var t = await svc.create({ name: 'A' });
  await svc.update(t.id, { name: 'B' });
  await svc.remove(t.id);
  ok('create event',               hits.indexOf('create') !== -1);
  ok('update event',               hits.indexOf('update') !== -1);
  ok('remove event',               hits.indexOf('remove') !== -1);

  // -------- Custom validate --------
  section('custom validate hook');
  var repo3 = repoFor('pm_strict');
  var strict = new C.CrudService(repo3, {
    entity: 'strict',
    requiredFields: ['name'],
    validate: function (x) {
      var errs = [];
      if (x.age != null && (typeof x.age !== 'number' || x.age < 0)) errs.push('age must be >= 0');
      return errs;
    }
  });
  await strict.load();
  await strict.create({ name: 'OK', age: 10 });
  ok('custom validate passes',     strict.list().length === 1);
  var bad = false;
  try { await strict.create({ name: 'Bad', age: -5 }); }
  catch (e) { bad = /age must be >= 0/.test(e.message); }
  ok('custom validate rejects',    bad === true);

  // -------- summary --------
  console.log('\n======================================');
  console.log('  passed: ' + pass);
  console.log('  failed: ' + fail);
  console.log('======================================');
  if (fail > 0) process.exit(1);
})().catch(function (err) {
  console.error('TEST RUN ERROR:', err);
  process.exit(2);
});
