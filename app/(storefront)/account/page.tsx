"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, MapPin, Package, Pencil, Plus, Trash2, User } from "lucide-react";
import { AuthGuard } from "@/components/storefront/auth-guard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OrderStatusPill } from "@/components/ui/status-pill";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/hooks/use-cart";
import { useCustomerSession } from "@/hooks/use-customer-session";
import { toast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import type { Address, Order } from "@/lib/types";
import { formatCurrency, timeAgo } from "@/lib/utils";
import { cn } from "@/lib/utils";

function AccountContent() {
  const router = useRouter();
  const user = useCustomerSession((s) => s.user);
  const logout = useCustomerSession((s) => s.logout);
  const updateProfile = useCustomerSession((s) => s.updateProfile);
  const addAddress = useCustomerSession((s) => s.addAddress);
  const updateAddress = useCustomerSession((s) => s.updateAddress);
  const deleteAddress = useCustomerSession((s) => s.deleteAddress);
  const addItem = useCart((s) => s.addItem);
  const setBranch = useCart((s) => s.setBranch);
  const clear = useCart((s) => s.clear);

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profile, setProfile] = useState({ name: "", phone: "" });
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState({
    label: "",
    line1: "",
    line2: "",
    city: "Portland",
    postalCode: "",
    isDefault: false,
  });

  useEffect(() => {
    if (user) {
      setProfile({ name: user.name, phone: user.phone });
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setOrdersLoading(true);
      try {
        const list = await api.getCustomerOrders(user.id);
        if (!cancelled) setOrders(list);
      } finally {
        if (!cancelled) setOrdersLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleSaveProfile = async () => {
    await updateProfile(profile);
    setEditingProfile(false);
    toast("Profile updated", { tone: "success" });
  };

  const resetAddressForm = () => {
    setAddressForm({
      label: "Home",
      line1: "",
      line2: "",
      city: "Portland",
      postalCode: "",
      isDefault: false,
    });
    setEditingAddressId(null);
    setShowAddressForm(false);
  };

  const handleSaveAddress = async () => {
    if (!addressForm.line1.trim() || !addressForm.postalCode.trim()) {
      toast("Fill in required address fields", { tone: "error" });
      return;
    }
    if (editingAddressId) {
      await updateAddress(editingAddressId, addressForm);
      toast("Address updated", { tone: "success" });
    } else {
      await addAddress(addressForm);
      toast("Address added", { tone: "success" });
    }
    resetAddressForm();
  };

  const startEditAddress = (addr: Address) => {
    setEditingAddressId(addr.id);
    setAddressForm({
      label: addr.label,
      line1: addr.line1,
      line2: addr.line2 ?? "",
      city: addr.city,
      postalCode: addr.postalCode,
      isDefault: addr.isDefault,
    });
    setShowAddressForm(true);
  };

  const handleReorder = (order: Order) => {
    clear();
    setBranch(order.branchId);
    for (const item of order.items) {
      addItem({
        menuItemId: item.menuItemId,
        name: item.name,
        imageUrl: `https://picsum.photos/seed/tabletap-${item.menuItemId}/640/480`,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        modifiers: item.modifiers,
        notes: item.notes,
      });
    }
    toast("Items added to cart", { tone: "success" });
    router.push(`/order/${order.branchId}`);
  };

  if (!user) return null;

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink">My account</h1>
          <p className="text-muted-foreground">{user.email}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { logout(); router.push("/"); }}>
          <LogOut className="size-4" />
          Sign out
        </Button>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="size-4" />
            Profile
          </CardTitle>
          {!editingProfile && (
            <Button variant="ghost" size="sm" onClick={() => setEditingProfile(true)}>
              <Pencil className="size-4" />
              Edit
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {editingProfile ? (
            <div className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="profile-name">Name</Label>
                <Input
                  id="profile-name"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="profile-phone">Phone</Label>
                <Input
                  id="profile-phone"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveProfile}>Save</Button>
                <Button variant="ghost" onClick={() => setEditingProfile(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-muted-foreground">Name</dt>
                <dd className="font-medium">{user.name}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Phone</dt>
                <dd className="font-medium">{user.phone}</dd>
              </div>
            </dl>
          )}
        </CardContent>
      </Card>

      {/* Addresses */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="size-4" />
            Saved addresses
          </CardTitle>
          {!showAddressForm && (
            <Button variant="outline" size="sm" onClick={() => setShowAddressForm(true)}>
              <Plus className="size-4" />
              Add
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {user.addresses.length === 0 && !showAddressForm && (
            <EmptyState
              title="No addresses yet"
              description="Add an address for faster checkout."
            />
          )}
          {user.addresses.map((addr) => (
            <div
              key={addr.id}
              className={cn(
                "flex items-start justify-between rounded-xl border p-4",
                addr.isDefault && "border-brand/30 bg-brand-tint/50",
              )}
            >
              <div>
                <p className="font-medium">
                  {addr.label}
                  {addr.isDefault && (
                    <span className="ml-2 text-xs text-brand">Default</span>
                  )}
                </p>
                <p className="text-sm text-muted-foreground">
                  {addr.line1}
                  {addr.line2 ? `, ${addr.line2}` : ""}, {addr.city} {addr.postalCode}
                </p>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => startEditAddress(addr)}>
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  onClick={() => deleteAddress(addr.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
          {showAddressForm && (
            <div className="space-y-3 rounded-xl border border-border p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label>Label</Label>
                  <Input
                    value={addressForm.label}
                    onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Postal code</Label>
                  <Input
                    value={addressForm.postalCode}
                    onChange={(e) =>
                      setAddressForm({ ...addressForm, postalCode: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Street</Label>
                <Input
                  value={addressForm.line1}
                  onChange={(e) => setAddressForm({ ...addressForm, line1: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Line 2 (optional)</Label>
                <Input
                  value={addressForm.line2}
                  onChange={(e) => setAddressForm({ ...addressForm, line2: e.target.value })}
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={addressForm.isDefault}
                  onChange={(e) =>
                    setAddressForm({ ...addressForm, isDefault: e.target.checked })
                  }
                />
                Set as default
              </label>
              <div className="flex gap-2">
                <Button onClick={handleSaveAddress}>
                  {editingAddressId ? "Update" : "Save"}
                </Button>
                <Button variant="ghost" onClick={resetAddressForm}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order history */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="size-4" />
            Order history
          </CardTitle>
        </CardHeader>
        <CardContent>
          {ordersLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <EmptyState
              title="No orders yet"
              description="Your online orders will appear here."
              action={
                <Button asChild>
                  <Link href="/order">Start ordering</Link>
                </Button>
              }
            />
          ) : (
            <ul className="space-y-3">
              {orders.map((order) => (
                <li
                  key={order.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{order.reference}</span>
                      <OrderStatusPill status={order.status} dot={false} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {timeAgo(order.placedAt)} · {formatCurrency(order.total)} ·{" "}
                      {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/track/${order.id}`}>Track</Link>
                    </Button>
                    <Button size="sm" onClick={() => handleReorder(order)}>
                      Re-order
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AccountPage() {
  return (
    <AuthGuard>
      <AccountContent />
    </AuthGuard>
  );
}
