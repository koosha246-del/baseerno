import { TableSkeleton } from "@/components/shared/Skeletons";

export default function UsersLoading() {
  return <TableSkeleton rows={10} />;
}
