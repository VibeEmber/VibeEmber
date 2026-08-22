import { Home } from "@/components/home";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  return (
    <Home
      initialSearch={first(params.q)}
      initialKind={first(params.kind)}
      initialCategory={first(params.topic)}
    />
  );
}
