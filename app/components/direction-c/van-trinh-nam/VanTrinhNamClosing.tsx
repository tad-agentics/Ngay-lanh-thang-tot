import {
  CBaziNlttLuanInkLoading,
  CBaziNlttLuanProse,
} from "~/components/direction-c/CBaziNlttLuanRow";

export function VanTrinhNamClosing({
  prose,
  luanLoading,
  luanFailed,
  instantProse,
  onRetryLuan,
}: {
  prose: string;
  luanLoading: boolean;
  luanFailed: boolean;
  instantProse?: boolean;
  onRetryLuan?: () => void;
}) {
  if (prose) {
    return (
      <CBaziNlttLuanProse text={prose} instant={instantProse} compact onRetry={onRetryLuan} />
    );
  }
  if (luanLoading) {
    return <CBaziNlttLuanInkLoading message="Đang kết bài" compact />;
  }
  if (luanFailed) {
    return (
      <CBaziNlttLuanProse
        failed
        failedMessage="Kết bài chưa luận được — thử Tải lại luận."
        onRetry={onRetryLuan}
        compact
      />
    );
  }
  return null;
}
