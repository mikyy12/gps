import { requireRole } from "@/lib/auth/require-role";
import { OperatorShell } from "@/components/operator/OperatorShell";

export default async function OperatorLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["operator"]);
  return <OperatorShell>{children}</OperatorShell>;
}
