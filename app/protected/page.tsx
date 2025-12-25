export default function ProtectedPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="text-muted-foreground">
        Welcome to your WhatsApp Reverse Auth dashboard. Here you can manage your sessions and settings.
      </p>
    </div>
  );
}
