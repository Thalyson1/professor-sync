import { EmptyState } from "@/components/ui/empty-state";

type TurmasDataStateProps = {
  title: string;
  description: string;
};

export function TurmasDataState({
  title,
  description
}: TurmasDataStateProps) {
  return <EmptyState title={title} description={description} />;
}
