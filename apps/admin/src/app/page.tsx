import { AdminShell } from "@/components/admin-shell";

export default function AdminHomePage() {
  return (
    <AdminShell>
      <section className="panel">
        <p className="eyebrow">Sprint 0</p>
        <h1>Admin foundation</h1>
        <p>
          This shell is ready for approval queues, item review, dispute operations, and
          recommendation curation after feature implementation is authorized.
        </p>
      </section>
    </AdminShell>
  );
}
