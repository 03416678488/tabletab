"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, RotateCcw, Save, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { useAccessMatrix } from "@/features/role-permission/hooks/use-access-matrix";
import { rolePermissionService } from "@/features/role-permission/services/role-permission.service";
import { ACTION_LABELS } from "@/features/role-permission/constants/role-permission.constants";
import type {
  ModuleRef,
  PermissionAction,
} from "@/features/role-permission/types/role-permission.types";

/** Display order for action columns. */
const ACTION_ORDER: PermissionAction[] = ["read", "create", "update", "delete"];

type Draft = Record<string, PermissionAction[]>;

function sameActions(a: PermissionAction[] = [], b: PermissionAction[] = []) {
  if (a.length !== b.length) return false;
  const set = new Set(a);
  return b.every((x) => set.has(x));
}

function cloneDraft(d: Draft): Draft {
  return Object.fromEntries(Object.entries(d).map(([k, v]) => [k, [...v]]));
}

export function RolePermissionManager() {
  const { matrix, loading, error, refetch } = useAccessMatrix();
  const [roleId, setRoleId] = useState<number | null>(null);
  const [draft, setDraft] = useState<Draft>({});
  const [saving, setSaving] = useState(false);

  // Pick the first role once the matrix arrives.
  useEffect(() => {
    if (matrix && roleId === null && matrix.roles.length) {
      setRoleId(matrix.roles[0].id);
    }
  }, [matrix, roleId]);

  const original = useMemo<Draft>(
    () => (matrix && roleId != null ? (matrix.grants[roleId] ?? {}) : {}),
    [matrix, roleId],
  );

  // Load the selected role's grants into the editable draft.
  useEffect(() => {
    setDraft(cloneDraft(original));
  }, [original]);

  const dirty = useMemo(() => {
    if (!matrix) return false;
    return matrix.modules.some((m) => !sameActions(draft[m.key], original[m.key]));
  }, [matrix, draft, original]);

  const has = (key: string, action: PermissionAction) => (draft[key] ?? []).includes(action);

  const toggle = (key: string, action: PermissionAction) => {
    setDraft((prev) => {
      const current = new Set(prev[key] ?? []);
      if (current.has(action)) current.delete(action);
      else {
        current.add(action);
        // Any action implies the ability to view.
        if (action !== "read") current.add("read");
      }
      return { ...prev, [key]: ACTION_ORDER.filter((a) => current.has(a)) };
    });
  };

  const toggleModuleAll = (key: string, on: boolean) =>
    setDraft((prev) => ({ ...prev, [key]: on ? [...ACTION_ORDER] : [] }));

  const toggleActionColumn = (action: PermissionAction, on: boolean) => {
    if (!matrix) return;
    setDraft((prev) => {
      const next: Draft = { ...prev };
      for (const m of matrix.modules) {
        const set = new Set(next[m.key] ?? []);
        if (on) {
          set.add(action);
          if (action !== "read") set.add("read");
        } else {
          set.delete(action);
        }
        next[m.key] = ACTION_ORDER.filter((a) => set.has(a));
      }
      return next;
    });
  };

  const reset = () => setDraft(cloneDraft(original));

  const save = async () => {
    if (roleId == null) return;
    setSaving(true);
    try {
      const grants: Draft = {};
      for (const [key, actions] of Object.entries(draft)) {
        if (actions.length) grants[key] = actions;
      }
      await rolePermissionService.updateRole(roleId, grants);
      await refetch();
    } catch {
    } finally {
      setSaving(false);
    }
  };

  // Group modules by their `group` for section headers.
  const groups = useMemo(() => {
    if (!matrix) return [];
    const order: string[] = [];
    const map = new Map<string, ModuleRef[]>();
    for (const m of matrix.modules) {
      if (!map.has(m.group)) {
        map.set(m.group, []);
        order.push(m.group);
      }
      map.get(m.group)!.push(m);
    }
    return order.map((g) => ({ group: g, modules: map.get(g)! }));
  }, [matrix]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-10 w-full max-w-xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (error || !matrix) {
    return (
      <Card className="p-0">
        <EmptyState
          className="py-12"
          icon={ShieldCheck}
          title="Couldn't load permissions"
          description={error ?? "No data"}
          action={
            <Button variant="outline" onClick={refetch}>
              Retry
            </Button>
          }
        />
      </Card>
    );
  }

  return (
    <div className="w-full">
      <div>
        <h1 className="flex items-center gap-2 font-display text-xl font-semibold tracking-tight text-ink">
          <ShieldCheck className="size-5 text-brand" /> Roles &amp; Permissions
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Choose a role, then grant module access. Changes apply to everyone in that role.
        </p>
      </div>

      {/* Role tabs */}
      <div className="mt-5 flex flex-wrap gap-2">
        {matrix.roles.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => setRoleId(r.id)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors",
              roleId === r.id
                ? "border-brand bg-brand text-white"
                : "border-border bg-white text-muted-foreground hover:text-ink",
            )}
          >
            {r.name}
          </button>
        ))}
      </div>

      {/* Matrix */}
      <Card className="mt-4 overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/40 text-left">
                <th className="px-4 py-3 font-semibold text-ink">Module</th>
                {ACTION_ORDER.map((a) => {
                  const allOn = matrix.modules.every((m) => has(m.key, a));
                  return (
                    <th key={a} className="px-3 py-2 text-center font-semibold text-ink">
                      <label className="flex flex-col items-center gap-1">
                        <span>{ACTION_LABELS[a]}</span>
                        <input
                          type="checkbox"
                          className="size-4 rounded border-border accent-brand"
                          checked={allOn}
                          onChange={(e) => toggleActionColumn(a, e.target.checked)}
                          aria-label={`Toggle ${ACTION_LABELS[a]} for all modules`}
                        />
                      </label>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {groups.map(({ group, modules }) => (
                <GroupRows
                  key={group}
                  group={group}
                  modules={modules}
                  has={has}
                  toggle={toggle}
                  toggleModuleAll={toggleModuleAll}
                />
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Footer actions */}
      <div className="mt-4 flex items-center justify-end gap-2">
        <span className="mr-auto text-sm text-muted-foreground">
          {dirty ? "Unsaved changes" : "All changes saved"}
        </span>
        <Button variant="outline" size="sm" disabled={!dirty || saving} onClick={reset}>
          <RotateCcw className="size-4" /> Reset
        </Button>
        <Button size="sm" disabled={!dirty || saving} onClick={save}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Save changes
        </Button>
      </div>
    </div>
  );
}

function GroupRows({
  group,
  modules,
  has,
  toggle,
  toggleModuleAll,
}: {
  group: string;
  modules: ModuleRef[];
  has: (key: string, action: PermissionAction) => boolean;
  toggle: (key: string, action: PermissionAction) => void;
  toggleModuleAll: (key: string, on: boolean) => void;
}) {
  return (
    <>
      <tr className="bg-secondary/20">
        <td
          colSpan={ACTION_ORDER.length + 1}
          className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
        >
          {group}
        </td>
      </tr>
      {modules.map((m) => {
        const allOn = ACTION_ORDER.every((a) => has(m.key, a));
        return (
          <tr key={m.key} className="border-b border-border last:border-0 hover:bg-secondary/20">
            <td className="px-4 py-2.5">
              <button
                type="button"
                onClick={() => toggleModuleAll(m.key, !allOn)}
                className="font-medium text-ink hover:text-brand"
                title="Toggle all"
              >
                {m.label}
              </button>
            </td>
            {ACTION_ORDER.map((a) => (
              <td key={a} className="px-3 py-2.5 text-center">
                <input
                  type="checkbox"
                  className="size-4 rounded border-border accent-brand"
                  checked={has(m.key, a)}
                  onChange={() => toggle(m.key, a)}
                  aria-label={`${m.label} — ${ACTION_LABELS[a]}`}
                />
              </td>
            ))}
          </tr>
        );
      })}
    </>
  );
}
