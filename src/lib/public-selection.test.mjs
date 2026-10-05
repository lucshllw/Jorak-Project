import test from 'node:test';
import assert from 'node:assert/strict';
import { selectPublicProjects } from './public-selection.ts';

test('public collection excludes missing, unconfirmed and social-only clips without deleting records', () => {
  const valid = { start: 178, end: 206, rangeStatus: 'explicit', clipUrl: '/api/media/clip' };
  const project = (id, status, segments) => ({ id, status, segments, order: Number(id) });
  const records = [project('1','published',[valid]),project('2','published',[]),project('3','published',[{...valid,clipUrl:null}]),project('4','published',[{...valid,clipUrl:'https://youtu.be/ynECM2La-dI'}]),project('5','published',[{...valid,rangeStatus:'inferred'}]),project('6','archived',[valid]),project('7','draft',[valid])];
  assert.deepEqual(selectPublicProjects(records).map(p=>p.id), ['1']);
  assert.deepEqual(selectPublicProjects(records,true).map(p=>p.id), ['1','7']);
  assert.equal(records.length,7);
  assert.equal(records[5].status,'archived');
});
