import { useLocation, useNavigate } from 'react-router-dom';
import { HelpCircle } from 'lucide-react';
import { PageHeader } from '../components/Shared';
import { useAppContext } from '../contexts/AppContext';

export default function PlannedPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { reviewMode } = useAppContext();
  
  const title = location.pathname.split('/').pop()?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Planned Page';

  return (
    <div>
      <PageHeader 
        title={title} 
        description="This page is planned for a future release."
        openQuestion={reviewMode ? "Requirements gathering in progress." : undefined}
        pageId="FAL_PLN_01"
        roles="All"
      />
      <div className="app_card mt-6 flex flex-col items-center justify-center p-12 text-center">
        <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4">
          <HelpCircle className="w-8 h-8 text-quaternary" />
        </div>
        <h4 className="h4 mb-2">Planned page</h4>
        <p className="text_md text-tertiary mb-6">The {title} screen is not part of this prototype.</p>
        <button className="btn btn_secondary_gray btn_md" onClick={() => navigate('/overview')}>Back to Overview</button>
      </div>
    </div>
  );
}
