export default function KitchenLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="-mx-4 -my-6 min-h-[calc(100vh-4rem)] bg-kitchen-bg px-4 py-6 text-white lg:-mx-8 lg:-my-8 lg:px-8 lg:py-8">
      {children}
    </div>
  );
}
