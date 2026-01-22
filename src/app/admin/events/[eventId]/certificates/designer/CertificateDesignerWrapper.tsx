'use client';

import { useCallback } from 'react';
import { CertificateDesigner } from '@/components/admin/certificate-designer';
import type { CertificateDesignTemplate } from '@/types/certificate-design';

interface CertificateDesignerWrapperProps {
  eventId: string;
  initialTemplate: CertificateDesignTemplate | null;
}

export default function CertificateDesignerWrapper({
  eventId,
  initialTemplate,
}: CertificateDesignerWrapperProps) {
  const handleSave = useCallback(async (template: CertificateDesignTemplate) => {
    const response = await fetch('/api/certificates/designs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ template }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Ошибка сохранения');
    }
  }, []);

  return (
    <CertificateDesigner
      eventId={eventId}
      initialTemplate={initialTemplate || undefined}
      onSave={handleSave}
    />
  );
}
