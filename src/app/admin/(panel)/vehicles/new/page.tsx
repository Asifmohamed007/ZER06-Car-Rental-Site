import Link from "next/link";
import { requireAdmin } from "@/server/auth";
import { VehicleForm } from "../VehicleForm";

export default async function NewVehicle() {
  await requireAdmin();
  return (
    <>
      <Link href="/admin/vehicles" className="text-sm text-cream/60 hover:text-cream">← Vehicles</Link>
      <h1 className="h2 mb-8 mt-3">Add a car</h1>
      <p className="mb-8 text-cream/65">You can add photos after saving.</p>
      <VehicleForm />
    </>
  );
}
