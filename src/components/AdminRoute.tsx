import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Shield } from 'lucide-react';
import { ReactNode } from 'react';
import { Button } from './ui/button';
import { Link } from 'react-router-dom';

interface AdminRouteProps {
  children: ReactNode;
}

const AdminRoute = ({ children }: AdminRouteProps) => {
  const { currentUser, userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
        <div className="h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center shadow-glow animate-pulse">
          <Shield className="h-8 w-8 text-white" />
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm font-medium">A verificar permissões...</span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (userRole !== 'admin') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-background px-4 text-center">
        <div className="h-20 w-20 rounded-3xl bg-destructive/10 flex items-center justify-center">
          <Shield className="h-10 w-10 text-destructive" />
        </div>
        <div>
          <h1 className="text-2xl font-black font-['Outfit'] mb-2">Acesso Negado</h1>
          <p className="text-muted-foreground max-w-sm">
            Não tem permissões para aceder a esta área. Contacte o administrador do sistema.
          </p>
        </div>
        <Link to="/">
          <Button className="gradient-primary text-white border-0 rounded-xl">
            Voltar ao Início
          </Button>
        </Link>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminRoute;
