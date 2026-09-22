import { requireRole } from "@/lib/auth/require-role";
import { AgencyShell } from "@/components/agency/AgencyShell";

export default async function AgencyLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["agency"]);
  return <AgencyShell>{children}</AgencyShell>;
}
