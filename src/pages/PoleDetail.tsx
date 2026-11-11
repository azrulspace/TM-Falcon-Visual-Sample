import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin } from 'lucide-react';
import { useAssets } from '@/contexts/AssetsContext';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatCoordinates } from '@/lib/geo';

export default function PoleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getPoleById } = useAssets();

  const pole = id ? getPoleById(id) : undefined;

  const handleBack = () => {
    const lastUrl = sessionStorage.getItem('last_poles_url');
    navigate(lastUrl || '/assets/poles');
  };

  if (!pole) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center min-h-[420px]">
        <MapPin className="size-10 text-muted-foreground mb-3" />
        <h2 className="text-lg font-semibold text-foreground">Pole not found</h2>
        <p className="text-xs text-muted-foreground mt-1 mb-4">
          The pole identifier &quot;{id}&quot; could not be found.
        </p>
        <Button variant="outline" onClick={handleBack} className="gap-2 text-xs">
          <ArrowLeft className="size-4" />
          <span>Back to Poles</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleBack} className="gap-1.5 text-xs">
            <ArrowLeft className="size-3.5" />
            <span>Back</span>
          </Button>
          <h1 className="text-2xl font-bold font-mono text-foreground">{pole.identifier}</h1>
          <StatusBadge status={pole.lifecycle} />
        </div>
      </div>
      <div className="rounded-xl border border-border bg-card p-6 text-xs space-y-2">
        <div>
          <span className="text-muted-foreground">Site: </span>
          <span className="font-medium text-foreground">{pole.siteName}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Location: </span>
          <span className="font-mono text-foreground">{formatCoordinates(pole.location)}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Relations: </span>
          <span className="text-foreground">
            {pole.linkedDevicesCount} devices, {pole.cableSpansCount} spans, {pole.events30dCount} events (30d)
          </span>
        </div>
      </div>
    </div>
  );
}

