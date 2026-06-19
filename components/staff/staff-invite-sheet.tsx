"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ROLE_LABELS } from "@/lib/nav";
import type { StaffInviteInput } from "@/hooks/use-staff-store";
import type { Branch, StaffRole } from "@/lib/types";

const ROLES: StaffRole[] = ["waiter", "chef", "manager"];

interface StaffInviteSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branches: Branch[];
  onInvite: (input: StaffInviteInput) => void;
}

export function StaffInviteSheet({
  open,
  onOpenChange,
  branches,
  onInvite,
}: StaffInviteSheetProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<StaffRole>("waiter");
  const [branchIds, setBranchIds] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setName("");
      setEmail("");
      setRole("waiter");
      setBranchIds(branches[0] ? [branches[0].id] : []);
      setErrors({});
    }
  }, [open, branches]);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Name is required";
    if (!email.trim()) next.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = "Invalid email";
    if (branchIds.length === 0) next.branches = "Select at least one branch";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const toggleBranch = (id: string) => {
    setBranchIds((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id],
    );
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onInvite({ name, email, role, branchIds });
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Invite staff member</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 px-6 pb-6">
          <div className="space-y-2">
            <Label htmlFor="staff-name">Full name</Label>
            <Input id="staff-name" value={name} onChange={(e) => setName(e.target.value)} />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="staff-email">Email</Label>
            <Input
              id="staff-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="staff-role">Role</Label>
            <select
              id="staff-role"
              value={role}
              onChange={(e) => setRole(e.target.value as StaffRole)}
              className="h-10 w-full rounded-xl border border-border bg-white px-3 text-sm"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Branches</Label>
            {branches.map((b) => (
              <label
                key={b.id}
                className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={branchIds.includes(b.id)}
                  onChange={() => toggleBranch(b.id)}
                />
                {b.name.replace("Olive & Ash — ", "")}
              </label>
            ))}
            {errors.branches && (
              <p className="text-xs text-destructive">{errors.branches}</p>
            )}
          </div>
        </div>

        <SheetFooter>
          <Button className="w-full" onClick={handleSubmit}>
            Send invite
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
