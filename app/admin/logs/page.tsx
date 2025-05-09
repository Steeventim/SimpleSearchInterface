import { LogsViewer } from "@/components/admin/logs-viewer";

export default function LogsPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Logs du système</h1>
      <LogsViewer />
    </div>
  );
}
