// RoleBadge.tsx
import { useAuth } from '../context/AuthContext';
import { Briefcase, Users } from 'lucide-react';

export function RoleBadge() {
  const { userRole } = useAuth();

  return (
    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
      userRole === 'employer' 
        ? 'bg-primary/10 text-primary border border-primary/20'
        : 'bg-secondary/10 text-secondary border border-secondary/20'
    }`}>
      {userRole === 'employer' ? (
        <>
          <Briefcase size={12} />
          <span>Employer Mode</span>
        </>
      ) : (
        <>
          <Users size={12} />
          <span>Worker Mode</span>
        </>
      )}
    </div>
  );
}