import { requireRole } from "@/lib/auth/require-role";
import { AdminShell } from "@/components/admin/AdminShell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(["admin"]);
  return <AdminShell>{children}</AdminShell>;
}
