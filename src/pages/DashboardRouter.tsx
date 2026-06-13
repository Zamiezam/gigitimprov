// DashboardRouter.tsx - Role-based dashboard router
import { useAuth } from '../context/AuthContext';
import EmployerDashboardView from '../components/EmployerDashboardView';
import WorkerBrowseView from '../components/WorkerBrowseView';
import { AppView } from '../types';
import { useState } from 'react';

export default function DashboardRouter() {
  const { userRole, switchRole } = useAuth();
  const [currentView, setCurrentView] = useState<AppView>(
    userRole === 'employer' ? AppView.EmployerDashboard : AppView.WorkerBrowse
  );

  // Role switcher with confirmation
  const handleRoleSwitch = async (targetRole: 'worker' | 'employer') => {
    if (targetRole === userRole) return;
    
    const confirmed = window.confirm(
      `Switching to ${targetRole === 'employer' ? 'Employer' : 'Worker'} mode. ` +
      `You will ${targetRole === 'employer' ? 'post gigs and manage applicants' : 'browse and apply for gigs'}. ` +
      `Continue?`
    );
    
    if (confirmed) {
      try {
        await switchRole(targetRole);
        setCurrentView(targetRole === 'employer' ? AppView.EmployerDashboard : AppView.WorkerBrowse);
      } catch (err) {
        alert('You do not have permission to switch to this role');
      }
    }
  };

  if (userRole === 'employer') {
    return (
      <EmployerDashboardView
        onNavigate={setCurrentView}
        gigs={[]}
        onAddGig={() => {}}
        onSwitchToWorker={() => handleRoleSwitch('worker')}
      />
    );
  }

  return (
    <WorkerBrowseView
      onNavigate={setCurrentView}
      fallbackGigs={[]}
      onSwitchToEmployer={() => handleRoleSwitch('employer')}
    />
  );
}