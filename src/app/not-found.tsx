import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="bg-indigo-100 p-4 rounded-full">
            <FileQuestion className="h-12 w-12 text-indigo-600" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Página no encontrada</h1>
        <p className="text-gray-500">La página que buscas no existe.</p>
        <Button asChild>
          <Link href="/dashboard">Ir al dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
