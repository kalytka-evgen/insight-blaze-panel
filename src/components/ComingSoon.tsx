import { PageHeader } from "./AppShell";

export function ComingSoon({ title }: { title: string }) {
  return (
    <>
      <PageHeader title={title} context="Розділ буде додано на наступному етапі" />
      <div className="p-6 text-sm text-muted-foreground">Розділ у розробці.</div>
    </>
  );
}
