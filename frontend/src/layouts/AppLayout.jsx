import BottomNav from "../components/BottomNav";
import FabMenu from "../components/FabMenu";

export default function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-paper dark:bg-ink">
      <div className="mx-auto max-w-md px-6 pb-24 pt-10">{children}</div>
      <FabMenu />
      <BottomNav />
    </div>
  );
}
