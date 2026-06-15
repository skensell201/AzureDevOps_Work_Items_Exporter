import React, { useMemo, useState } from 'react';
import { Column, FieldDef } from '../models/types';

interface Props {
  fields: FieldDef[];
  value: Column[];
  onChange: (cols: Column[]) => void;
  /** Work item type names, for scoping a rollup sum (e.g. "Sum of Task Original Estimate"). */
  types?: string[];
}

const NUMERIC = new Set(['integer', 'double']);

/** Fixed computed columns the user can toggle on/off. */
const COMPUTED: { id: string; header: string; make: () => Column; match: (c: Column) => boolean }[] = [
  { id: 'parent', header: 'Parent', make: () => ({ kind: 'parent', header: 'Parent' }), match: (c) => c.kind === 'parent' },
  {
    id: 'hierarchyPath',
    header: 'Hierarchy Path',
    make: () => ({ kind: 'hierarchyPath', header: 'Hierarchy Path' }),
    match: (c) => c.kind === 'hierarchyPath',
  },
  { id: 'level', header: 'Level', make: () => ({ kind: 'level', header: 'Level' }), match: (c) => c.kind === 'level' },
  {
    id: 'childCountAll',
    header: 'Child Count',
    make: () => ({ kind: 'childCount', variant: 'all', header: 'Child Count' }),
    match: (c) => c.kind === 'childCount' && c.variant === 'all',
  },
  {
    id: 'childCountClosed',
    header: 'Closed Child Count',
    make: () => ({ kind: 'childCount', variant: 'closed', header: 'Closed Child Count' }),
    match: (c) => c.kind === 'childCount' && c.variant === 'closed',
  },
];

export function ColumnPicker({ fields, value, onChange, types = [] }: Props): JSX.Element {
  const [search, setSearch] = useState('');
  const [sumField, setSumField] = useState('');
  const [sumType, setSumType] = useState('');

  const numeric = useMemo(() => fields.filter((f) => NUMERIC.has(f.type)), [fields]);
  const checkedRefs = useMemo(
    () => new Set(value.filter((c) => c.kind === 'field').map((c) => (c as { referenceName: string }).referenceName)),
    [value]
  );
  const shown = useMemo(() => fields.filter((f) => f.name.toLowerCase().includes(search.toLowerCase())), [fields, search]);

  function toggleField(f: FieldDef): void {
    if (checkedRefs.has(f.referenceName)) {
      onChange(value.filter((c) => !(c.kind === 'field' && c.referenceName === f.referenceName)));
    } else {
      onChange([...value, { kind: 'field', referenceName: f.referenceName, header: f.name }]);
    }
  }

  function toggleComputed(spec: (typeof COMPUTED)[number]): void {
    if (value.some(spec.match)) onChange(value.filter((c) => !spec.match(c)));
    else onChange([...value, spec.make()]);
  }

  function addSum(): void {
    if (!sumField) return;
    const f = numeric.find((n) => n.referenceName === sumField);
    if (!f) return;
    const ofType = sumType || undefined;
    if (value.some((c) => c.kind === 'rollupSum' && c.field === sumField && c.ofType === ofType)) return;
    const col: Column = ofType
      ? { kind: 'rollupSum', field: f.referenceName, ofType, header: `Sum of ${ofType} ${f.name}` }
      : { kind: 'rollupSum', field: f.referenceName, header: `Sum of ${f.name}` };
    onChange([...value, col]);
    setSumField('');
    setSumType('');
  }

  return (
    <div className="column-picker">
      <input placeholder="Search fields..." value={search} onChange={(e) => setSearch(e.target.value)} />
      <div className="field-list">
        {shown.map((f) => (
          <label key={f.referenceName}>
            <input type="checkbox" checked={checkedRefs.has(f.referenceName)} onChange={() => toggleField(f)} /> {f.name}
          </label>
        ))}
      </div>
      <div className="computed-list">
        {COMPUTED.map((spec) => (
          <label key={spec.id}>
            <input type="checkbox" checked={value.some(spec.match)} onChange={() => toggleComputed(spec)} /> {spec.header}
          </label>
        ))}
      </div>
      <div className="rollup-add">
        <label htmlFor="sumField">Add rollup sum of</label>
        <select id="sumField" value={sumField} onChange={(e) => setSumField(e.target.value)}>
          <option value="">—</option>
          {numeric.map((f) => (
            <option key={f.referenceName} value={f.referenceName}>
              {f.name}
            </option>
          ))}
        </select>
        <label htmlFor="sumType">Of type</label>
        <select id="sumType" value={sumType} onChange={(e) => setSumType(e.target.value)}>
          <option value="">Any type</option>
          {types.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <button type="button" onClick={addSum}>
          Add sum column
        </button>
      </div>
    </div>
  );
}
