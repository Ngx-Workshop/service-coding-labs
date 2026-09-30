// Opt-in smoke test against a local development API. Uses its own lab records.
const assert = require('node:assert/strict');
const base = process.env.CODING_LABS_TEST_URL || 'http://127.0.0.1:3009';
if (!/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(base)) throw new Error('Smoke tests require a loopback API');
async function api(path, method = 'GET', body, status = 200) {
  const response = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  const text = await response.text();
  assert.equal(response.status, status, method + ' ' + path + ': ' + text);
  return text ? JSON.parse(text) : undefined;
}
(async () => {
  const lab = await api('/labs', 'POST', { workshopId: 'local-verification', slug: 'smoke-' + Date.now(), title: 'Verified sum challenge', createdBy: 'smoke' }, 201);
  const prefix = '/labs/' + lab._id + '/versions';
  let draft = await api(prefix + '/draft', 'POST', { createdBy: 'smoke' }, 201);
  const again = await api(prefix + '/draft', 'POST', { createdBy: 'smoke' }, 201);
  assert.equal(draft._id, again._id);
  const id = draft._id;
  const save = async changes => {
    draft = await api(prefix + '/' + id, 'PATCH', { ...changes, createdBy: 'smoke', expectedContentHash: draft.contentHash });
    assert.equal(draft._id, id);
  };
  const stale = draft.contentHash;
  await save({ referenceSolution: { code: 'function solve(input: number[]): number { return input.reduce((sum, n) => sum + n, 0); }' } });
  await api(prefix + '/' + id, 'PATCH', { createdBy: 'smoke', expectedContentHash: stale, promptMarkdown: 'stale' }, 409);
  await save({ hints: ['Start with zero.'] });
  assert.equal((await api(prefix)).length, 1);
  let result = await api(prefix + '/' + id + '/verify', 'POST', {}, 200);
  assert.equal(result.passed, true, JSON.stringify(result));
  console.log('PASS create, repeated save, conflict, correct TypeScript reference');
  await save({ referenceSolution: { code: 'function solve(input) { return -999; }' } });
  result = await api(prefix + '/' + id + '/verify', 'POST', {}, 200);
  assert.equal(result.passed, false);
  await api(prefix + '/' + id + '/publish', 'POST', { publishedBy: 'smoke', expectedContentHash: draft.contentHash }, 400);
  console.log('PASS wrong answer diagnostics and publish gate');
  await save({ referenceSolution: { code: 'function solve(input) { while (true) {} }' }, runner: { entryFnName: 'solve', timeoutMs: 100, memoryMb: 128 } });
  result = await api(prefix + '/' + id + '/verify', 'POST', {}, 200);
  assert.ok(result.results.every(test => test.status === 'timeout'), JSON.stringify(result));
  console.log('PASS bounded infinite-loop execution');
  await save({ referenceSolution: { code: 'async function solve(input) { return await new Promise(() => {}); }' } });
  result = await api(prefix + '/' + id + '/verify', 'POST', {}, 200);
  assert.ok(result.results.every(test => test.status === 'timeout'), JSON.stringify(result));
  await save({ referenceSolution: { code: 'function solve(input) { throw new Error("example failure"); }' } });
  result = await api(prefix + '/' + id + '/verify', 'POST', {}, 200);
  assert.ok(result.results.every(test => test.status === 'error' && test.message.includes('example failure')));
  await save({ referenceSolution: { code: 'function solve( {' } });
  await api(prefix + '/' + id + '/verify', 'POST', {}, 400);
  console.log('PASS async timeout, runtime error, syntax error');
  const cases = [null, 0, false, 'hello', [1,2], { b: 2, a: 1 }];
  await save({
    referenceSolution: { code: 'function solve(input) { return input; }' },
    sampleTests: cases.slice(0,3).map((value,i) => ({ name:'sample '+i, kind:'io', input:value, expected:value, comparator:{kind:'deepEqual'} })),
    hiddenTests: cases.slice(3).map((value,i) => ({ name:'hidden '+i, kind:'io', input:value, expected:value, comparator:{kind:'deepEqual'} })),
  });
  result = await api(prefix + '/' + id + '/verify', 'POST', {}, 200);
  assert.equal(result.passed, true, JSON.stringify(result));
  const published = await api(prefix + '/' + id + '/publish', 'POST', { publishedBy: 'smoke', expectedContentHash: draft.contentHash }, 200);
  assert.equal(published.isDraft, false);
  await api(prefix + '/' + id, 'PATCH', { createdBy: 'smoke', expectedContentHash: draft.contentHash }, 400);
  const learner = await api('/published-labs/' + lab._id);
  assert.ok(!('referenceSolution' in learner) && !('hiddenTests' in learner));
  assert.equal(learner.sampleTests[0].input, null);
  const embed = await api('/embeds', 'POST', { labId: lab._id, workshopId: 'local-verification', workshopDocumentId: 'local-document', blockId: 'local-block', pinnedVersionId: id, createdBy: 'smoke' }, 201);
  assert.equal(embed.pinnedVersionId, id);
  await api('/embeds', 'POST', { labId: lab._id, workshopId: 'wrong-workshop', workshopDocumentId: 'document', blockId: 'block', createdBy: 'smoke' }, 400);
  const next = await api(prefix + '/draft', 'POST', { createdBy: 'smoke' }, 201);
  assert.equal(next.versionNumber, 2);
  assert.equal(next.referenceSolution.code, draft.referenceSolution.code);
  await api('/labs/' + lab._id, 'DELETE', undefined, 204);
  await api('/published-labs/' + lab._id, 'GET', undefined, 404);
  console.log('PASS JSON primitives, publication, immutability, redaction, next version, archive');
  console.log('Archived smoke lab: ' + lab._id);
})().catch(error => { console.error(error); process.exitCode = 1; });
