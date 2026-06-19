import type { TaskNode } from "@/schemas";
import { auditNode } from "./audit";

/**
 * Filtre DSL'i (JQL-benzeri) — saf, bağımlılıksız tokenizer + recursive-descent parser.
 * Alan adları whitelist (QUERY_FIELDS); serbest eval YOK. UI (Faz 1) bunu tüketir.
 * Örnek: `status = done AND level in [app, module] AND score >= 2.3`
 */

export const QUERY_FIELDS = [
  "status",
  "level",
  "priority",
  "owner",
  "assignees",
  "milestone",
  "cluster",
  "tag",
  "phase",
  "progress",
  "effort",
  "score",
  "criticalPath",
] as const;
export type QueryField = (typeof QUERY_FIELDS)[number];

export const QUERY_OPS = ["=", "!=", ">", ">=", "<", "<=", "in", "contains", "exists"] as const;
export type QueryOp = (typeof QUERY_OPS)[number];

export type QueryValue = string | number | boolean | string[];
export type QueryAst =
  | { kind: "true" }
  | { kind: "and"; left: QueryAst; right: QueryAst }
  | { kind: "or"; left: QueryAst; right: QueryAst }
  | { kind: "not"; expr: QueryAst }
  | { kind: "cmp"; field: QueryField; op: QueryOp; value: QueryValue };

export interface QueryError {
  error: string;
}
export function isQueryError(x: unknown): x is QueryError {
  return typeof x === "object" && x !== null && "error" in x;
}

type Tok =
  | { t: "lp" }
  | { t: "rp" }
  | { t: "lb" }
  | { t: "rb" }
  | { t: "comma" }
  | { t: "op"; v: string }
  | { t: "str"; v: string }
  | { t: "word"; v: string };

function tokenize(s: string): Tok[] | QueryError {
  const out: Tok[] = [];
  let i = 0;
  const n = s.length;
  while (i < n) {
    const c = s[i];
    if (/\s/.test(c)) {
      i++;
      continue;
    }
    if (c === "(") {
      out.push({ t: "lp" });
      i++;
      continue;
    }
    if (c === ")") {
      out.push({ t: "rp" });
      i++;
      continue;
    }
    if (c === "[") {
      out.push({ t: "lb" });
      i++;
      continue;
    }
    if (c === "]") {
      out.push({ t: "rb" });
      i++;
      continue;
    }
    if (c === ",") {
      out.push({ t: "comma" });
      i++;
      continue;
    }
    if (c === '"' || c === "'") {
      const q = c;
      i++;
      let v = "";
      while (i < n && s[i] !== q) {
        v += s[i];
        i++;
      }
      if (i >= n) return { error: "Kapanmamış tırnak" };
      i++;
      out.push({ t: "str", v });
      continue;
    }
    if (c === "=" || c === "!" || c === "<" || c === ">") {
      let op = c;
      i++;
      if (s[i] === "=") {
        op += "=";
        i++;
      }
      out.push({ t: "op", v: op });
      continue;
    }
    let w = "";
    while (i < n && !/[\s()[\],"'=!<>]/.test(s[i])) {
      w += s[i];
      i++;
    }
    if (w === "") return { error: `Beklenmeyen karakter: ${c}` };
    out.push({ t: "word", v: w });
  }
  return out;
}

export function parseQuery(input: string): QueryAst | QueryError {
  const trimmed = input.trim();
  if (!trimmed) return { kind: "true" };
  const toks = tokenize(trimmed);
  if (isQueryError(toks)) return toks;
  let pos = 0;
  let err: QueryError | null = null;
  const peek = (): Tok | undefined => toks[pos];
  const eat = (): Tok | undefined => toks[pos++];
  const isWord = (v: string): boolean => {
    const t = peek();
    return !!t && t.t === "word" && t.v.toLowerCase() === v;
  };
  const fail = (m: string): QueryAst => {
    if (!err) err = { error: m };
    return { kind: "true" };
  };

  const parseExpr = (): QueryAst => parseOr();
  const parseOr = (): QueryAst => {
    let left = parseAnd();
    while (!err && isWord("or")) {
      eat();
      left = { kind: "or", left, right: parseAnd() };
    }
    return left;
  };
  const parseAnd = (): QueryAst => {
    let left = parseNot();
    while (!err && isWord("and")) {
      eat();
      left = { kind: "and", left, right: parseNot() };
    }
    return left;
  };
  const parseNot = (): QueryAst => {
    if (isWord("not")) {
      eat();
      return { kind: "not", expr: parseNot() };
    }
    return parseAtom();
  };
  const parseAtom = (): QueryAst => {
    const t = peek();
    if (!t) return fail("Beklenen ifade, giriş bitti");
    if (t.t === "lp") {
      eat();
      const e = parseExpr();
      if (err) return e;
      const c = eat();
      if (!c || c.t !== "rp") return fail("Kapanmamış parantez");
      return e;
    }
    return parseCmp();
  };
  const parseCmp = (): QueryAst => {
    const f = eat();
    if (!f || f.t !== "word") return fail("Alan adı bekleniyor");
    const field = f.v.toLowerCase();
    if (!(QUERY_FIELDS as readonly string[]).includes(field)) return fail(`Bilinmeyen alan: ${f.v}`);
    const opt = eat();
    let op: QueryOp;
    if (opt && opt.t === "op") {
      if (!(QUERY_OPS as readonly string[]).includes(opt.v)) return fail(`Bilinmeyen operatör: ${opt.v}`);
      op = opt.v as QueryOp;
    } else if (opt && opt.t === "word" && ["in", "contains", "exists"].includes(opt.v.toLowerCase())) {
      op = opt.v.toLowerCase() as QueryOp;
    } else {
      return fail("Operatör bekleniyor");
    }
    if (op === "exists") return { kind: "cmp", field: field as QueryField, op, value: true };
    if (op === "in") {
      const lb = eat();
      if (!lb || lb.t !== "lb") return fail("'in' için [liste] bekleniyor");
      const list: string[] = [];
      for (;;) {
        const v = peek();
        if (!v) return fail("Kapanmamış liste");
        if (v.t === "rb") {
          eat();
          break;
        }
        if (v.t === "comma") {
          eat();
          continue;
        }
        if (v.t === "word" || v.t === "str") {
          list.push(v.v);
          eat();
          continue;
        }
        return fail("Liste öğesi bekleniyor");
      }
      return { kind: "cmp", field: field as QueryField, op, value: list };
    }
    const v = eat();
    if (!v || (v.t !== "word" && v.t !== "str")) return fail("Değer bekleniyor");
    return { kind: "cmp", field: field as QueryField, op, value: coerce(v.v) };
  };

  const ast = parseExpr();
  if (err) return err;
  if (pos < toks.length) return { error: "Fazladan girdi (eksik AND/OR olabilir)" };
  return ast;
}

function coerce(s: string): QueryValue {
  if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s);
  if (s === "true") return true;
  if (s === "false") return false;
  return s;
}

type Resolved =
  | { kind: "string"; value: string }
  | { kind: "number"; value: number }
  | { kind: "boolean"; value: boolean }
  | { kind: "array"; value: string[] };

function resolve(node: TaskNode, field: QueryField): Resolved {
  switch (field) {
    case "status":
      return { kind: "string", value: node.status };
    case "level":
      return { kind: "string", value: node.level };
    case "priority":
      return { kind: "string", value: node.priority };
    case "owner":
      return { kind: "string", value: node.owner ?? "" };
    case "milestone":
      return { kind: "string", value: node.milestone ?? "" };
    case "phase":
      return { kind: "string", value: node.phase };
    case "cluster":
      return { kind: "string", value: node.source?.cluster ?? "" };
    case "tag":
      return { kind: "array", value: node.tags ?? [] };
    case "assignees":
      return { kind: "array", value: node.assignees ?? [] };
    case "progress":
      return { kind: "number", value: node.progress };
    case "effort":
      return { kind: "number", value: node.effort.estimate };
    case "score":
      return { kind: "number", value: auditNode(node).score };
    case "criticalPath":
      return { kind: "boolean", value: node.criticalPath };
    default:
      return { kind: "string", value: "" };
  }
}

function evalCmp(node: TaskNode, c: Extract<QueryAst, { kind: "cmp" }>): boolean {
  const r = resolve(node, c.field);
  const v = c.value;
  switch (c.op) {
    case "exists":
      if (r.kind === "array") return r.value.length > 0;
      if (r.kind === "string") return r.value !== "";
      return r.value !== null && r.value !== undefined;
    case "=":
      if (r.kind === "array") return r.value.includes(String(v));
      if (r.kind === "boolean") return r.value === (v === true || v === "true");
      if (r.kind === "number") return r.value === Number(v);
      return r.value === String(v);
    case "!=":
      if (r.kind === "array") return !r.value.includes(String(v));
      if (r.kind === "number") return r.value !== Number(v);
      return String(r.value) !== String(v);
    case ">":
      return r.kind === "number" && r.value > Number(v);
    case ">=":
      return r.kind === "number" && r.value >= Number(v);
    case "<":
      return r.kind === "number" && r.value < Number(v);
    case "<=":
      return r.kind === "number" && r.value <= Number(v);
    case "in": {
      const list = (Array.isArray(v) ? v : [v]).map(String);
      if (r.kind === "array") return r.value.some((x) => list.includes(x));
      return list.includes(String(r.value));
    }
    case "contains": {
      const needle = String(v).toLowerCase();
      if (r.kind === "array") return r.value.some((x) => x.toLowerCase().includes(needle));
      return String(r.value).toLowerCase().includes(needle);
    }
    default:
      return false;
  }
}

export function matchNode(node: TaskNode, ast: QueryAst): boolean {
  switch (ast.kind) {
    case "true":
      return true;
    case "and":
      return matchNode(node, ast.left) && matchNode(node, ast.right);
    case "or":
      return matchNode(node, ast.left) || matchNode(node, ast.right);
    case "not":
      return !matchNode(node, ast.expr);
    case "cmp":
      return evalCmp(node, ast);
    default:
      return true;
  }
}

export function filterNodes(nodes: TaskNode[], ast: QueryAst): TaskNode[] {
  return nodes.filter((n) => matchNode(n, ast));
}
