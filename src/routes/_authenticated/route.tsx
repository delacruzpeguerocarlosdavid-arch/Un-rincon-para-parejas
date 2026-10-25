import { createFileRoute, Outlet } from '@tanstack/react-router';

// Permite acceso libre a todas las áreas románticas para que ninguna pareja quede bloqueada por registro
export const Route = createFileRoute('/_authenticated')({ 
  ssr: false, 
  component: Outlet 
});
